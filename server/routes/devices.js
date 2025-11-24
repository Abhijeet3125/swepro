const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Device = require('../models/Device');

// Register Device
router.post('/', auth, async (req, res) => {
  const { macAddress, deviceName } = req.body;
  try {
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
