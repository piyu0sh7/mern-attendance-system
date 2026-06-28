const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  punchInTime: {
    type: Date,
    required: true
  },
  punchOutTime: {
    type: Date
  },
  punchInLocation: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  punchOutLocation: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  punchInSelfie: {
    type: String // Cloudinary URL or Base64
  },
  isManual: {
    type: Boolean,
    default: false
  },
  punchOutSelfie: {
    type: String // Base64 string
  },
  totalWorkingHours: {
    type: Number
  },
  status: {
    type: String,
    enum: ['Completed', 'Incomplete'],
    default: 'Incomplete'
  },
  adminValidationStatus: {
    type: String,
    enum: ['Valid', 'Invalid', 'Pending'],
    default: 'Pending'
  },
  remarks: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
