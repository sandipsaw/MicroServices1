const userModel = require('../Models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const registerUser = async (req, res) => {

    const { username, email, password, fullname: { firstname, lastname }, role } = req.body;

    try {
        const isuser = await userModel.findOne({
            $or: [{ username }, { email }]
        }).lean();

        if (isuser) {
            return res.status(400).json({
                message: "user already exists.."
            })
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hashPassword,
            fullname: { firstname, lastname },
            role
        })


        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '1d' })

        res.cookie('token', token, {
            secure: true,
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
        })

        res.status(201).json({
            message: 'user Registered successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullname: {
                    firstname: user.fullname.firstname,
                    lastname: user.fullname.lastname,
                },
                addresses: user.addresses
            }
        })
    }
    catch (error) {
        console.log(error);

    }
}

module.exports = {
    registerUser
}