const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street:String,
    city:String,
    state:String,
    pin_code:Number,
    country:String
})

const userSchema = new mongoose.Schema({
    username:{type:String,required:true, unique:true},

    email:{type:String, required:true, unique:true},

    password:{type:String,Select:false},

    fullname:{
        firstname:{type:String,required:true},
        lastname:{type:String,required:true},
    },

    role:{type:String, enum:['user','admin'] },

    addresses :[ addressSchema ]
})

const userModel = mongoose.model("user",userSchema)

module.exports = userModel;