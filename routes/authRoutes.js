const express = require('express');

const authController = require('../controllers/authController');

const router = express.Router();

router.post('/createUser', authController.createUser);

router.post('/loginUser', authController.loginUser);

module.exports = router;