const express = require('express');
const router = express.Router();
const manualPunchController = require('../controllers/manualPunchController');
const authController = require('../controllers/authController');

router.use(authController.protect);

router.post('/', authController.restrictTo('Employee'), manualPunchController.submitRequest);
router.get('/my-requests', authController.restrictTo('Employee'), manualPunchController.getMyRequests);

router.get('/pending', authController.restrictTo('Manager', 'Admin'), manualPunchController.getPendingRequests);
router.patch('/:id', authController.restrictTo('Manager', 'Admin'), manualPunchController.updateStatus);

module.exports = router;
