const cartModel = require('../model/cart.model');

const addItemToCart = async() =>{
    const {productId,qty} = req.body;
    const user = req.user;
    let cart = await cartModel.findOne({user: user.id});

}