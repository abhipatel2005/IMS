const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_name: String,
  product_key: String,
  department: String,
  category: String,
  sub_category: String,
  specification: String, 
});

const Products = mongoose.model('Products', productSchema);

module.exports = Products;