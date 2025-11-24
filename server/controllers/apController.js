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
    
    this.refreshPolicies();
    
    setInterval(() => this.refreshPolicies(), 5000);
    
    this.startProcessingLoop();
  }

  async refreshPolicies() {
    try {
      const policies = await QoSPolicy.find({ isActive: true, priority: 'High' });
      this.policyCache = new Set(policies.map(p => p.name));
      this.policyCache = new Set(policies.map(p => p.name));
    } catch (err) {
      console.error('Error refreshing policies:', err.message);
    }
  }

  async handleIngress(req, res) {
    try {
      const packet = req.body;
      
      const isPriority = this.policyCache.has(packet.appType);
      packet.isPriority = isPriority;

      if (isPriority) {
        this.highPriorityQueue.push(packet);
        res.status(200).json({ status: 'Queued (High)' });
      } else {
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

  checkPriority(appType) {
    return this.policyCache.has(appType);
  }

  startProcessingLoop() {
    setInterval(async () => {
      this.processNextPacket();
    }, 60);
  }

  async processNextPacket() {
    let packet = null;

    if (this.highPriorityQueue.length > 0) {
      packet = this.highPriorityQueue.shift();
    } else if (this.normalQueue.length > 0) {
      packet = this.normalQueue.shift();
    }

    if (packet) {
      try {
        await axios.post('http://localhost:5000/api/simulation/receive', packet);
      } catch (error) {
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

module.exports = new APController();
