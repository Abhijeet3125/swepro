const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Device = require('../models/Device');

// Register Device
router.post('/', auth, async (req, res) => {
  const { macAddress, deviceName } = req.body;
  try {
    // 1. Check Device Limit (Max 2)
    const deviceCount = await Device.countDocuments({ owner: req.user.id });
    if (deviceCount >= 2) {
      return res.status(400).json({ msg: 'Maximum device limit reached (2 devices)' });
    }

    // 2. Validate MAC Address Format
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(macAddress)) {
      return res.status(400).json({ msg: 'Invalid MAC address format (XX:XX:XX:XX:XX:XX)' });
    }

    const newDevice = new Device({
      macAddress,
      deviceName,
      owner: req.user.id
    });
    const device = await newDevice.save();
    res.json(device);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get User's Devices
router.get('/', auth, async (req, res) => {
  try {
    const devices = await Device.find({ owner: req.user.id });
    res.json(devices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete Device
router.delete('/:id', auth, async (req, res) => {
  try {
    let device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ msg: 'Device not found' });

    if (device.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Device.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Device removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
