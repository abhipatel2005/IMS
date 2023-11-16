const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: String,  // Unique identifier for each month, e.g., 'counters_202304' for April 2023
  sequence_value: {
    type: Number,
    default: 0,
  },
});

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
