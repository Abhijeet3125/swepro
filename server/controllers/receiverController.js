const apController = require('./apController');

class ReceiverController {
  constructor() {
    this.priorityHistory = [];
    this.generalHistory = [];
    this.MAX_HISTORY = 50;
    this.lastPriorityPacketTime = 0;
  }

  // Endpoint: POST /api/simulation/receive
  receivePacket(req, res) {
    const packet = req.body;
    const latency = Date.now() - packet.timestamp;

    if (packet.isPriority) {
      this.priorityHistory.push(latency);
      if (this.priorityHistory.length > this.MAX_HISTORY) this.priorityHistory.shift();
      this.lastPriorityPacketTime = Date.now();
    } else {
      this.generalHistory.push(latency);
      if (this.generalHistory.length > this.MAX_HISTORY) this.generalHistory.shift();
    }

    res.status(200).json({ status: 'Received' });
  }

  // Endpoint: GET /api/simulation/metrics
  getMetrics(req, res) {
    // Check for stale priority traffic (if no priority packets for > 3 seconds)
    if (Date.now() - this.lastPriorityPacketTime > 3000) {
      this.priorityHistory = [];
    }

    // Calculate Averages
    let avgPriority = this.calculateAverage(this.priorityHistory);
    const avgGeneral = this.calculateAverage(this.generalHistory);
    
    // Get Drop Counts from AP Controller
    const drops = apController.resetDropCounts();
    
    // Calculate Split Packet Loss
    let priorityLoss = drops.priority > 0 ? ((drops.priority / (drops.priority + 20)) * 100).toFixed(1) : 0;
    const generalLoss = drops.general > 0 ? ((drops.general / (drops.general + 20)) * 100).toFixed(1) : 0;

    // BASELINE SYNC: If no priority traffic (no QoS active), mirror General metrics
    // This ensures the chart lines overlap when no policy is set.
    if (this.priorityHistory.length === 0) {
      avgPriority = avgGeneral;
      priorityLoss = generalLoss;
    }

    res.json({
      timestamp: new Date().toISOString(),
      priorityLatency: Math.round(avgPriority) || 0,
      generalLatency: Math.round(avgGeneral) || 0,
      priorityPacketLoss: Number(priorityLoss),
      generalPacketLoss: Number(generalLoss),
      jitter: Math.floor(Math.random() * 5)
    });
  }

  calculateAverage(arr) {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
  }
}

module.exports = new ReceiverController();
