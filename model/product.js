const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_name: String,
  product_key: String,
  category: String,
  specification: String,
  quantity: Number,
  username: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // isApproved: { type: Boolean, default: false }
  price: Number,
});

const Products = mongoose.model('Products', productSchema);

module.exports = Products;