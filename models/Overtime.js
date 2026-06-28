const mongoose = require('mongoose');

const overtimeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  requestedHours: {
    type: Number,
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

module.exports = mongoose.model('Overtime', overtimeSchema);
