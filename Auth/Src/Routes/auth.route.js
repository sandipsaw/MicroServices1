const express = require('express');
const authController = require('../Controllers/auth.controller');
const validator = require('../../Src/middleware/validator.middleware')
const authMiddleware = require('../../Src/middleware/auth.middleware')
const router = express.Router();

router.post('/register',validator.registerUserValidation, authController.registerUser);
router.post('/login', validator.loginUserValidation, authController.loginUser);
router.get('/me', authMiddleware.requireAuth, authController.getMe);
router.get('/logout',authMiddleware.requireAuth, authController.logoutUser);

module.exports = router;
