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

const getProduct = async(req,res) =>{
  const {q, minPrice, maxPrice, limit=20, skip=0} = req.query;
  
  const filter = {}

  if(q){
    filter.$text = {$search: q}
  }
  if(minPrice){
    filter['price.amount'] = {...filter['price.amount'],$gte:Number(minPrice)}
  }
  if(maxPrice){
    filter['price.amount'] = {...filter['price.amount'],$lte:Number(maxPrice)}
  }
  const product = await productModel.find(filter).skip(Number(skip)).limit(Math.min(Number(limit), 20))

  return res.status(200).json({message:"product search successfully",data: product})
}

const getProductById = async(req,res) => {
  const {id} = req.params;
  if(!id){
    return res.status(400).json({message:'invalid id'})
  }
  const product = await productModel.findById(id)
  if(!product){
    return res.status(404).json({message:'product not found'})
  }
  return res.status(200).json({product: product})
}

module.exports = { createProduct,getProduct, getProductById };