const userModel = require('../Models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const redis = require('../db/redis')

const registerUser = async (req, res) => {

    const { username, email, password, fullname: { firstname, lastname }, role , addresses:{street,city,state,country,pin_code,phone} } = req.body;

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
            addresses:{street,city,state,country,pin_code,phone},
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
                addresses:user.addresses
            }
        })
    }
    catch (error) {
        console.log(error);
    }
}

const loginUser = async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const user = await userModel.findOne({
            $or: [{ username: identifier }, { email: identifier }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'invalid credentials' });
        }

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

        res.status(200).json({
            message: 'user logged in successfully',
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
        res.status(500).json({ message: 'server error' })
    }
}

const getMe = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'unauthorized' });

        res.status(200).json({
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
        console.log(error)
        res.status(500).json({ message: 'server error' })
    }
}

const logoutUser = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'not authenticated' });
        }
        await redis.set(`blacklist:${token}`, 'true', 'EX', 24 * 60 * 60 );
        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
        });
        return res.status(200).json({ message: 'logged out successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: 'server error' });
    }
    

}

const getAddresses = async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({ addresses: user.addresses });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error' });
    }
}

const addAddress = async (req, res) => {
    try {
        const user = req.user;
        const { street, city, state, pin_code, country, phone, isDefault } = req.body;

        // if requested isDefault, unset other default flags
        if (isDefault) {
            user.addresses.forEach(a => { a.isDefault = false; });
        }

        const newAddress = { street, city, state, pin_code, country, phone, isDefault: !!isDefault };
        if (user.addresses.length === 0 && typeof isDefault === 'undefined') newAddress.isDefault = true;

        user.addresses.push(newAddress);
        await user.save();
        const created = user.addresses[user.addresses.length - 1];
        return res.status(201).json({ addresses: created });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error' });
    }
}

const deleteAddress = async (req, res) => {
    try {
        const user = req.user;
        const { addressid } = req.params;
        const addr = user.addresses.id(addressid);
        if (!addr) return res.status(404).json({ message: 'address not found' });
        // Mongoose subdoc remove() may not be available depending on how the doc is hydrated
        // Use pull to remove by id for compatibility
        user.addresses.pull(addressid);
        await user.save();
        return res.status(200).json({ message: 'address removed' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error' });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getMe,
    logoutUser,
    getAddresses,
    addAddress,
    deleteAddress
}

