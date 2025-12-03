const { body, validationResult } = require('express-validator');

const responseWithValidationErrors = (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() })
    }
    next();
}
const registerUserValidation = [
    body('username')
        .isString()
        .withMessage("username must be string")
        .isLength({ min: 3 })
        .withMessage("username must be atleast 3 character long"),
    body('email')
        .isEmail()
        .withMessage('Invalid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('password must be atleast 6 character long'),
    body('fullname.firstname')
        .isString()
        .withMessage('firstname must be string')
        .notEmpty()
        .withMessage('firstname is required'),
    body('fullname.lastname')
        .isString()
        .withMessage('lastname must be string')
        .notEmpty()
        .withMessage('lastname is required'),
    body('role')
        .optional()
        .isIn(['user', 'seller'])
        .withMessage('role must be either user or seller'),
    responseWithValidationErrors
]

const loginUserValidation = [
    body('identifier')
        .isString()
        .withMessage('identifier must be a string (username or email)')
        .notEmpty()
        .withMessage('identifier is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('password must be atleast 6 character long'),
    responseWithValidationErrors
]

const addAddressValidation = [
    body('street')
        .isString()
        .withMessage('street must be a string')
        .notEmpty()
        .withMessage('street is required'),
    body('city')
        .isString()
        .withMessage('city must be a string')
        .notEmpty()
        .withMessage('city is required'),
    body('country')
        .isString()
        .withMessage('country must be a string')
        .notEmpty()
        .withMessage('country is required'),
    body('pin_code')
        .isString()
        .withMessage('pin_code must be a string')
        .matches(/^[0-9]{4,10}$/)
        .withMessage('pin_code must be numeric and 4 to 10 digits'),
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('phone must be a valid mobile phone'),
    responseWithValidationErrors
]

module.exports = { registerUserValidation, loginUserValidation, addAddressValidation };
