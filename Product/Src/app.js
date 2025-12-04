const express = require('express');
const cookieParser = require('cookie-parser')
const productRoutes = require('../Src/routes/product.routes')

const app = express()
// fix: call express.json() to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use('/api/product',productRoutes)

module.exports = app 