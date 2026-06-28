const Overtime = require('../models/Overtime');

exports.submitRequest = async (req, res) => {
  try {
    const { date, requestedHours } = req.body;

    const overtime = await Overtime.create({
      user: req.user._id,
      date,
      requestedHours,
      status: 'Pending'
    });

    res.status(201).json({
      status: 'success',
      data: { overtime }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerRemarks } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
       return res.status(400).json({ status: 'fail', message: 'Status must be Approved or Rejected' });
    }

    const overtime = await Overtime.findById(id);
    if (!overtime) {
      return res.status(404).json({ status: 'fail', message: 'Overtime request not found' });
    }

    overtime.status = status;
    if (managerRemarks) {
      overtime.managerRemarks = managerRemarks;
    }

    await overtime.save();

    res.status(200).json({
      status: 'success',
      data: { overtime }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await Overtime.find({ user: req.user._id }).sort('-date');
    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: { requests }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.getAllPending = async (req, res) => {
  try {
    const requests = await Overtime.find({ status: 'Pending' })
      .populate('user', 'name email role')
      .sort('-date');
    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: { requests }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};
