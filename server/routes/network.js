const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const AccessPoint = require('../models/AccessPoint');
const EventLog = require('../models/EventLog');
const QoSPolicy = require('../models/QoSPolicy');

// Get Network Status (APs, Logs, QoS)
router.get('/status', async (req, res) => {
  try {
    const accessPoints = await AccessPoint.find();
    const recentLogs = await EventLog.find().sort({ timestamp: -1 }).limit(10);
    const qosPolicies = await QoSPolicy.find().sort({ createdAt: -1 });
    
    res.json({
      accessPoints,
      recentLogs,
      qosPolicies
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add QoS Policy
router.post('/qos', async (req, res) => {
  try {
    const { name, priority, description } = req.body;
    const newPolicy = new QoSPolicy({ name, priority, description });
    await newPolicy.save();
    res.json(newPolicy);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Toggle QoS Policy
router.patch('/qos/:id/toggle', async (req, res) => {
  try {
    const policy = await QoSPolicy.findById(req.params.id);
    if (!policy) return res.status(404).json({ msg: 'Policy not found' });
    
    policy.isActive = !policy.isActive;
    await policy.save();
    res.json(policy);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete QoS Policy
router.delete('/qos/:id', async (req, res) => {
  try {
    await QoSPolicy.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Policy removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get Network Metrics (Latency, Jitter, Packet Loss)
router.get('/metrics', async (req, res) => {
  try {
    const activePolicies = await QoSPolicy.find({ isActive: true });
    const isHighPriority = activePolicies.some(p => p.priority === 'High');

    let priorityLatency, generalLatency, jitter, packetLoss;

    if (isHighPriority) {
      // Optimized (Policy ON)
      // Priority traffic gets fast lane
      priorityLatency = Math.floor(Math.random() * (40 - 20 + 1) + 20); // 20-40ms
      // General traffic gets throttled
      generalLatency = Math.floor(Math.random() * (500 - 300 + 1) + 300); // 300-500ms
      
      jitter = Math.floor(Math.random() * 5); // 0-5ms
      packetLoss = 0;
    } else {
      // Congested (Policy OFF)
      // Both suffer equally
      priorityLatency = Math.floor(Math.random() * (200 - 100 + 1) + 100); // 100-200ms
      generalLatency = Math.floor(Math.random() * (200 - 100 + 1) + 100); // 100-200ms
      
      jitter = Math.floor(Math.random() * (100 - 20 + 1) + 20); // 20-100ms
      packetLoss = (Math.random() * 5).toFixed(2); // 0-5%
    }

    res.json({
      timestamp: new Date(),
      priorityLatency,
      generalLatency,
      jitter,
      packetLoss
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Remote Restart Access Point
router.patch('/ap/:id/restart', async (req, res) => {
  try {
    const ap = await AccessPoint.findById(req.params.id);
    if (!ap) {
      return res.status(404).json({ msg: 'Access Point not found' });
    }

    // Simulate restart - set status to Online
    ap.status = 'Online';
    ap.load = Math.floor(Math.random() * 30) + 10; // Reset to low load (10-40%)
    await ap.save();

    // Log the restart event
    await EventLog.create({
      type: 'Info',
      message: `Access Point ${ap.name} was remotely restarted`,
      source: ap.name
    });

    res.json(ap);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
