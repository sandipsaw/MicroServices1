const jwt = require('jsonwebtoken');
const userModel = require('../Models/user.model');

const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies && req.cookies.token;
        if (!token) return res.status(401).json({ message: 'unauthorized' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'unauthorized' });

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'unauthorized' });
    }
}

module.exports = {requireAuth};
