const express = require('express');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('Manager', 'Admin'));

// User management
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);

// Attendance detail & validation
router.get('/attendance/:id', adminController.getAttendanceById);
router.patch('/attendance/:id/validate', adminController.validateAttendance);

// Reporting endpoints
router.get('/reports/daily', adminController.getDailyReport);

module.exports = router;
