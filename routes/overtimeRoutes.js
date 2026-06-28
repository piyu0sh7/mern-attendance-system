const express = require('express');
const overtimeController = require('../controllers/overtimeController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

// Employees submit overtime and view their own
router.post('/', overtimeController.submitRequest);
router.get('/my-requests', overtimeController.getMyRequests);

// Managers & Admins list pending and process them
router.get('/pending', authController.restrictTo('Manager', 'Admin'), overtimeController.getAllPending);
router.patch('/:id', authController.restrictTo('Manager', 'Admin'), overtimeController.updateRequestStatus);

module.exports = router;
