const express = require('express');

const authController = require('../controllers/authController');

const protect = require('../middleware/authMiddleware');

const authorize = require('../middleware/roleMiddleware');

const router = express.Router();

// USERS

router.post('/createUser', authController.createUser);

router.post('/loginUser', authController.loginUser);

router.get('/getUser', protect, authController.getUser);

router.patch('/updateUser', protect, authController.updateUser);

router.patch('/changePassword', protect, authController.changePassword);

router.patch('/deactivateAccount', protect, authController.deactivateAccount);

router.post('/verifyEmail', authController.verifyEmail);

router.post('/resendVerificationCode', authController.resendVerificationCode)

// ADMIN

router.get('/getAllUsers', protect, authorize('ADMIN'), authController.getAllUsers);

router.patch('/deactivateUser/:userId', protect, authorize('ADMIN'), authController.deactivateUser);

router.patch('/activateUser/:userId', protect, authorize('ADMIN'), authController.activateUser);

module.exports = router;