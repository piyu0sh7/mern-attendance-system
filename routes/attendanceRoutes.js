const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const authController = require('../controllers/authController');

const router = express.Router();

// Apply auth protection middleware to all routes below
router.use(authController.protect);

router.post('/punch-in', attendanceController.punchIn);
router.post('/punch-out/:id', attendanceController.punchOut);
router.get('/my-history', attendanceController.getMyAttendance);

module.exports = router;
