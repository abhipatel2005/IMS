const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_name: String,
  product_key: String,
  department: String,
  category: String,
  sub_category: String,
  specification: String,
  quantity: Number,
  username: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isApproved: { type: Boolean, default: false }
});

const Products = mongoose.model('Products', productSchema);

module.exports = Products;