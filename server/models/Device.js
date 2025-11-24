const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  macAddress: { type: String, required: true, unique: true },
  deviceName: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});

module.exports = mongoose.model('Device', DeviceSchema);
