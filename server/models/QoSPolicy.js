const mongoose = require('mongoose');

const QoSPolicySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  priority: {
    type: String,
    enum: ['High', 'Normal'],
    default: 'Normal'
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QoSPolicy', QoSPolicySchema);
