require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure logging using Morgan
app.use(morgan('dev'));

// Middleware for parsing JSON requests (increased limit for Base64 selfie images)
app.use(cors());
app.use(express.json({ limit: '10mb' })); 

const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const overtimeRoutes = require('./routes/overtimeRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const manualPunchRoutes = require('./routes/manualPunchRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/manual-punch', manualPunchRoutes);
app.use('/api/admin', adminRoutes);

// Setup MongoDB connection using Mongoose
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Successfully connected to MongoDB.'))
.catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Attendance Management System API is running.');
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
