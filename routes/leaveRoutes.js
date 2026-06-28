const express = require('express');
const leaveController = require('../controllers/leaveController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.post('/', leaveController.submitLeave);
router.get('/my-requests', leaveController.getMyLeaves);

// Manager/Admin routes
router.use(authController.restrictTo('Manager', 'Admin'));
router.get('/pending', leaveController.getPendingLeaves);
router.patch('/:id', leaveController.updateLeaveStatus);

module.exports = router;
