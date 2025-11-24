const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  issueType: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['New', 'In Progress', 'Resolved'], default: 'New' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);
