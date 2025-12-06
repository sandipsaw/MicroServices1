const productModel = require("../model/product.model");
const { uploadImage } = require('../services/imagekit.service');
const mongoose = require('mongoose');

const createProduct = async (req, res) => {
  try {
    const { title, description, priceAmount, priceCurrency } = req.body;
    // debug logs removed
    const seller = req.user.id;

    const price = { amount: priceAmount, currency: priceCurrency || "INR" }


    console.log(req.files);

    const images = await Promise.all((req.files || []).map(file => uploadImage({ buffer: file.buffer })));

    const created = await productModel.create({ title, description, price, seller, image: images });


    return res.status(201).json({ success: true, data: created });

  }
  catch (error) {
    console.error('create product error', error);
    return res.status(500).json({ success: false, message: "Internal Server error" });
  }
};

const getProduct = async (req, res) => {
  const { q, minPrice, maxPrice, limit = 20, skip = 0 } = req.query;

  const filter = {}

  if (q) {
    filter.$text = { $search: q }
  }
  if (minPrice) {
    filter['price.amount'] = { ...filter['price.amount'], $gte: Number(minPrice) }
  }
  if (maxPrice) {
    filter['price.amount'] = { ...filter['price.amount'], $lte: Number(maxPrice) }
  }
  const product = await productModel.find(filter).skip(Number(skip)).limit(Math.min(Number(limit), 20))

  return res.status(200).json({ message: "product search successfully", data: product })
}

const getProductById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'invalid id' })
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'invalid id' })
  }
  const product = await productModel.findById(id)
  if (!product) {
    return res.status(404).json({ message: 'product not found' })
  }
  return res.status(200).json({ success: true, data: product })
}

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'invalid product id' })
    }
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'product not found' })
    }
    if (product.seller.toString() != req.user.id) {
      return res.status(403).json({ message: 'you can only update your own product' })
    }
    const allowedUpdate = ['title', 'description', 'price']

    for (const key of Object.keys(req.body)) {
      if (allowedUpdate.includes(key)) {
        if (key === 'price' && typeof req.body.price === 'object') {
          if (req.body.price.amount != undefined) {
            product.price.amount = Number(req.body.price.amount)
          }
          if (req.body.price.currency != undefined) {
            product.price.currency = req.body.price.currency
          }
        }
        else {
          product[key] = req.body[key]
        }
      }
    }
    await product.save();
    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error('updateProduct error', err);
    return res.status(500).json({ success: false, message: 'Internal Server error' });
  }
}

const deleteProduct = async(req,res)=>{
  const {id} = req.params;
  if(!mongoose.Types.ObjectId.isValid(id)){
    return res.status(400).json({message:'inavlid product id'})
  }
  const product = await productModel.findById(id);
  if(!product){
    return res.status(404).json({message:'product not found'})
  }
  if(product.seller.toString() != req.user.id){
    return res.status(403).json({message:'forbidden you can only delete your own product'})
  }
  await productModel.findOneAndDelete(id)
  return res.status(200).json({message:'product deleted successfully'})
}

const getSellerProduct = async (req, res) => {
  try {
    const sellerId = req.user?.id;
    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { skip = 0, limit = 20 } = req.query;
    const products = await productModel
      .find({ seller: sellerId })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 20));
    return res.status(200).json({ data: products });
  } catch (err) {
    console.error('getSellerProduct error', err);
    return res.status(500).json({ success: false, message: 'Internal Server error' });
  }
};
module.exports = { createProduct, getProduct, getProductById, updateProduct, deleteProduct, getSellerProduct };