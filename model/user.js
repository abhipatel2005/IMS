// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  userRole: {
    type: String,
    default: 'user',
  },
});

module.exports = mongoose.model('User', userSchema);//remember to try using new keyword at strating of the line as showned in the udemy