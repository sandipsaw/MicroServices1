const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street:String,
    city:String,
    state:String,
    pin_code:Number,
    country:String
})

const userSchema = new mongoose.Schema({
    username:{type:String,require:true, unique:true},

    email:{type:String, require:true, unique:true},

    password:{type:String},

    fullname:{
        firstname:{type:String,require:true},
        lastname:{type:String,require:true},
    },

    role:{type:String, enum:['user','admin'] },

    addresses :[ addressSchema ]
})

const userModel = mongoose.model("user",userSchema)

module.exports = userModel;