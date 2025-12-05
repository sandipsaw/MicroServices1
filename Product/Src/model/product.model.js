const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title:{
        type:String, 
        required:true
    },
    description:{
        type:String,
        required:true
    },
    price:{
        amount:{
            type:Number,
            required:true
        },
        currency:{
            type:String,
            enum:['USD','INR'],
            default:'INR'
        }
    },
    image:[
        {
            url:String,
            thumbnail:String,
            id:String
        }
    ],
    seller:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    }
})
productSchema.index({title:'text',description:'text'});

const productModel = mongoose.model('product',productSchema);

module.exports = productModel;