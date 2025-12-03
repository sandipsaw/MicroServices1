const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    pin_code: { type: String },
    country: { type: String, required: true },
    phone: { type: String },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    username:{type:String,required:true, unique:true},

    email:{type:String, required:true, unique:true},

    password:{type:String,Select:false},

    fullname:{
        firstname:{type:String,required:true},
        lastname:{type:String,required:true},
    },

    role:{type:String, enum:['user','seller'] },

    addresses :[ addressSchema ]
})

const userModel = mongoose.model("user",userSchema)

module.exports = userModel;