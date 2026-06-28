const Leave = require('../models/Leave');
const User = require('../models/User');

exports.submitLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const leave = await Leave.create({
      user: req.user._id,
      startDate,
      endDate,
      reason
    });
    res.status(201).json({ status: 'success', data: { leave } });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user._id }).sort('-createdAt');
    res.status(200).json({ status: 'success', data: { leaves } });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.getPendingLeaves = async (req, res) => {
  try {
    let userQuery = {};
    if (req.user.role === 'Manager') {
       userQuery = { role: 'Employee' };
    }
    const usersToInclude = await User.find(userQuery).select('_id');
    const userIds = usersToInclude.map(u => u._id);

    const leaves = await Leave.find({
      status: 'Pending',
      user: { $in: userIds }
    }).populate('user', 'name email role').sort('startDate');

    res.status(200).json({ status: 'success', data: { leaves } });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerRemarks } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid status' });
    }

    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ status: 'fail', message: 'Leave not found' });

    leave.status = status;
    if (managerRemarks) leave.managerRemarks = managerRemarks;
    
    await leave.save();
    res.status(200).json({ status: 'success', data: { leave } });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};
