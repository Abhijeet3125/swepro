const axios = require('axios');
const QoSPolicy = require('../models/QoSPolicy');

class APController {
  constructor() {
    this.highPriorityQueue = [];
    this.normalQueue = [];
    this.isProcessing = false;
    this.MAX_QUEUE_SIZE = 20;
    this.priorityDropCount = 0;
    this.generalDropCount = 0;
    
    this.policyCache = new Set();
    this.refreshPolicies();
    
    // Refresh policies every 5 seconds
    setInterval(() => this.refreshPolicies(), 5000);
    
    // Start the processing loop
    this.startProcessingLoop();
  }

  async refreshPolicies() {
    try {
      const policies = await QoSPolicy.find({ isActive: true, priority: 'High' });
      this.policyCache = new Set(policies.map(p => p.name));
      // console.log('QoS Policies Refreshed:', this.policyCache.size);
    } catch (err) {
      console.error('Error refreshing policies:', err.message);
    }
  }

  // Ingress Endpoint Logic
  async handleIngress(req, res) {
    try {
      const packet = req.body;
      
      // 1. Determine Priority based on Cached Policies
      const isPriority = this.policyCache.has(packet.appType);
      packet.isPriority = isPriority;

      // 2. Enqueue Logic
      if (isPriority) {
        // Infinite Queue for Priority - NEVER DROP
        this.highPriorityQueue.push(packet);
        res.status(200).json({ status: 'Queued (High)' });
      } else {
        // Congestion Control for Normal Traffic
        if (this.normalQueue.length >= this.MAX_QUEUE_SIZE) {
          this.generalDropCount++;
          return res.status(503).json({ status: 'Dropped (Congestion)' });
        }
        this.normalQueue.push(packet);
        res.status(200).json({ status: 'Queued (Normal)' });
      }
    } catch (error) {
      console.error('Ingress Error:', error);
      res.status(500).json({ error: 'Internal Error' });
    }
  }

  // Helper to check priority (Now synchronous using cache)
  checkPriority(appType) {
    return this.policyCache.has(appType);
  }

  startProcessingLoop() {
    // Run every 60ms (slower than ingress to cause backlog)
    setInterval(async () => {
      this.processNextPacket();
    }, 60);
  }

  async processNextPacket() {
    let packet = null;

    // Strict Priority Queuing: Always empty High Priority first
    if (this.highPriorityQueue.length > 0) {
      packet = this.highPriorityQueue.shift();
    } else if (this.normalQueue.length > 0) {
      packet = this.normalQueue.shift();
    }

    if (packet) {
      try {
        // Forward to Receiver
        await axios.post('http://localhost:5000/api/simulation/receive', packet);
      } catch (error) {
        // If receiver is down, we might drop or retry. For sim, we drop.
        // console.error('Forwarding failed', error.message);
      }
    }
  }
  
  getDropCounts() {
    return { priority: this.priorityDropCount, general: this.generalDropCount };
  }
  
  resetDropCounts() {
    const counts = { priority: this.priorityDropCount, general: this.generalDropCount };
    this.priorityDropCount = 0;
    this.generalDropCount = 0;
    return counts;
  }
}

// Export a singleton instance
module.exports = new APController();
