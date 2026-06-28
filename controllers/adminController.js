const Attendance = require('../models/Attendance');
const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, worksiteLat, worksiteLon, worksiteRadius } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ status: 'fail', message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'Employee',
      worksiteLat: worksiteLat || null,
      worksiteLon: worksiteLon || null,
      worksiteRadius: worksiteRadius || 500
    });

    // Remove password from output
    newUser.password = undefined;

    res.status(201).json({ status: 'success', data: { user: newUser } });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find().select('-password').sort('name').skip(skip).limit(limit);
    const total = await User.countDocuments();

    res.status(200).json({
      status: 'success',
      results: users.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: { users }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate('user', 'name email role');
    if (!attendance) {
      return res.status(404).json({ status: 'fail', message: 'Attendance record not found' });
    }
    res.status(200).json({
      status: 'success',
      data: { attendance }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.validateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; 

    if (!['Valid', 'Invalid'].includes(status)) {
       return res.status(400).json({ status: 'fail', message: 'Status must be Valid or Invalid' });
    }

    const attendance = await Attendance.findById(id).populate('user', 'name email role');
    if (!attendance) {
      return res.status(404).json({ status: 'fail', message: 'Attendance record not found' });
    }

    // Update validation status and append remarks
    attendance.adminValidationStatus = status;
    if (remarks) attendance.remarks = remarks;

    await attendance.save();

    res.status(200).json({
      status: 'success',
      data: { attendance }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.getDailyReport = async (req, res) => {
  try {
    const { date } = req.query; // format: YYYY-MM-DD
    
    // Set start and end of the specified day or default to today
    let startOfDay, endOfDay;
    if (date) {
      startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
    } else {
      startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
    }

    // RBAC check: Managers see 'Employee' role users, Admins see everyone
    let userQuery = {};
    if (req.user.role === 'Manager') {
       // Assuming no direct manager mapping exists, we limit managers to see only base Employees
       userQuery = { role: 'Employee' };
    }

    // Find applicable users for the role
    const usersToInclude = await User.find(userQuery).select('_id');
    const userIds = usersToInclude.map(u => u._id);

    // Get attendance for these users within the day timeframe
    const attendances = await Attendance.find({
      user: { $in: userIds },
      punchInTime: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate('user', 'name email role')
    .sort('-punchInTime'); 

    // Formatting for the report (e.g. projecting only necessary fields for daily report)
    const reportData = attendances.map(record => ({
      attendanceId: record._id,
      name: record.user ? record.user.name : 'Unknown',
      punchInTime: record.punchInTime,
      punchOutTime: record.punchOutTime,
      punchInLocation: record.punchInLocation,
      punchOutLocation: record.punchOutLocation,
      totalWorkingHours: record.totalWorkingHours,
      status: record.status,
      adminValidationStatus: record.adminValidationStatus,
      remarks: record.remarks,
      // Expose selfie if they want to view the Base64 in report details
      punchInSelfie: record.punchInSelfie,
      punchOutSelfie: record.punchOutSelfie
    }));

    res.status(200).json({
      status: 'success',
      results: reportData.length,
      data: {
        report: reportData
      }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};
