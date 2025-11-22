const express = require('express');
const authController = require('../Controllers/auth.controller');
const validator = require('../../Src/middleware/validator.middleware')
const router = express.Router();

router.post('/register',validator.registerUserValidation, authController.registerUser);

module.exports = router;
