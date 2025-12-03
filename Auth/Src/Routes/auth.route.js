const express = require('express');
const authController = require('../Controllers/auth.controller');
const validator = require('../middleware/validator.middleware')
const authMiddleware = require('../middleware/auth.middleware')
const router = express.Router();

router.post('/register',validator.registerUserValidation, authController.registerUser);
router.post('/login', validator.loginUserValidation, authController.loginUser);
router.get('/me', authMiddleware.requireAuth, authController.getMe);
router.get('/logout',authMiddleware.requireAuth, authController.logoutUser);
router.get('/users/me/addresses', authMiddleware.requireAuth, authController.getAddresses);
router.post('/users/me/addresses', authMiddleware.requireAuth, validator.addAddressValidation, authController.addAddress);
router.delete('/users/me/addresses/:addressid', authMiddleware.requireAuth, authController.deleteAddress);

module.exports = router;
