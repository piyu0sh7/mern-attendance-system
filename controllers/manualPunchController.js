const ManualPunch = require('../models/ManualPunch');
const Attendance = require('../models/Attendance');

exports.submitRequest = async (req, res) => {
  try {
    const { date, punchInTime, punchOutTime, reason } = req.body;
    const request = await ManualPunch.create({
      user: req.user._id,
      date,
      punchInTime,
      punchOutTime,
      reason
    });

    res.status(201).json({ status: 'success', data: { request } });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await ManualPunch.find({ user: req.user._id }).sort('-createdAt');
    res.status(200).json({ status: 'success', data: { requests } });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    // Managers and Admins can see all pending
    const requests = await ManualPunch.find({ status: 'Pending' })
      .populate('user', 'name email role')
      .sort('-createdAt');
    res.status(200).json({ status: 'success', data: { requests } });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerRemarks } = req.body;

    const request = await ManualPunch.findById(id);
    if (!request) return res.status(404).json({ status: 'fail', message: 'Request not found' });

    request.status = status;
    if (managerRemarks) request.managerRemarks = managerRemarks;
    await request.save();

    // If approved, create or update the attendance record
    if (status === 'Approved') {
      const targetDate = new Date(request.date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      let attendance = await Attendance.findOne({
        user: request.user,
        punchInTime: { $gte: startOfDay, $lte: endOfDay }
      });

      if (!attendance) {
        // Create new record
        attendance = new Attendance({
          user: request.user,
          punchInTime: request.punchInTime || targetDate,
          isManual: true,
          adminValidationStatus: 'Valid',
          remarks: 'Created via Manual Punch Request'
        });
      }

      if (request.punchInTime) attendance.punchInTime = request.punchInTime;
      
      if (request.punchOutTime) {
        attendance.punchOutTime = request.punchOutTime;
        const durationMs = new Date(attendance.punchOutTime) - new Date(attendance.punchInTime);
        const totalWorkingHours = durationMs / (1000 * 60 * 60);
        attendance.totalWorkingHours = parseFloat(totalWorkingHours.toFixed(2));
        attendance.status = totalWorkingHours >= 8 ? 'Completed' : 'Incomplete';
      }

      attendance.isManual = true;
      attendance.adminValidationStatus = 'Valid';
      await attendance.save();
    }

    res.status(200).json({ status: 'success', data: { request } });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};
