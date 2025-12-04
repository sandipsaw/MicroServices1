const express = require('express');
const multer = require('multer');
const {createAuthMiddleware} = require('../middleware/auth.middleware')
const {createProductValidators} = require('../middleware/product.validator')
const {createProduct} = require('../controllers/product.controller');

const router = express.Router();

// Use multer memory storage so files are available in req.file.buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/',createAuthMiddleware(['admin','seller']), upload.array('images',5),createProductValidators,createProduct);

module.exports = router