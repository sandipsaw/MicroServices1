const productModel = require("../model/product.model");
const { uploadImage } = require('../services/imagekit.service');

const createProduct = async (req, res) => {
  try {
    const { title, description, priceAmount, priceCurrency } = req.body;
    // debug logs removed
    const seller = req.user.id;

    const price = { amount: priceAmount, currency: priceCurrency || "INR" }
    
    
    console.log(req.files);
    
    const images = await Promise.all((req.files || []).map(file => uploadImage({ buffer: file.buffer })));
    
    const created = await productModel.create({title,description,price,seller,image:images});
    
    
    return res.status(201).json({ success: true, data: created });

  }
  catch (error) {
    console.error('create product error', error);
    return res.status(500).json({ success: false, message: "Internal Server error" });
  }
};

module.exports = { createProduct };