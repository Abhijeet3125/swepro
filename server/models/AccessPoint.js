const mongoose = require('mongoose');

const AccessPointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
  load: {
    type: Number,
    default: 0
  },
  activeClients: {
    type: Number,
    default: 0
  },
  trafficRate: {
    type: String,
    default: '0 Mbps'
  },
  ipAddress: {
    type: String,
    default: function() {
      return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }
  },
  uptime: {
    type: String,
    default: '0h 0m'
  }
}, { timestamps: true });

module.exports = mongoose.model('AccessPoint', AccessPointSchema);
