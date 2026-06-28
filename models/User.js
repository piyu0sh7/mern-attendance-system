const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Employee', 'Manager', 'Admin'],
    default: 'Employee',
    required: true
  },
  worksiteLat: {
    type: Number,
    default: null
  },
  worksiteLon: {
    type: Number,
    default: null
  },
  worksiteRadius: {
    type: Number,
    default: 500 // in meters
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
