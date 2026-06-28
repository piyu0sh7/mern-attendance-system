const mongoose = require('mongoose');

const manualPunchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  punchInTime: {
    type: Date,
    required: false
  },
  punchOutTime: {
    type: Date,
    required: false
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  managerRemarks: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('ManualPunch', manualPunchSchema);
