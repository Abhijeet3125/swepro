const mongoose = require('mongoose');

const EventLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Info', 'Warning', 'Critical', 'Security'],
    default: 'Info'
  },
  message: {
    type: String,
    required: true
  },
  source: {
    type: String, // e.g., "AP-Lib-01" or "System"
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EventLog', EventLogSchema);
