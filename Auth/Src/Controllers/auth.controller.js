const userModel = require('../Models/user.model');
const bcrypt = require('bcryptjs');

const registerUser = async() =>{
    const {username,email,password,fullname:{firstname,lastname}} = req.body;

    const isuser = await userModel.findOne({
        username
    })
    if(isuser){
        return res.status(401).json({
            message:"user already exists.."
        })
    }
    const user = await userModel.create({
        username,email,password,fullname:{firstname,lastname}
    })
}

module.exports = {
    registerUser
}