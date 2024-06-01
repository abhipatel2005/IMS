const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    username: String,
    phone: Number,
    email: String,
    address: String,
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;