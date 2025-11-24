const apController = require('./apController');

class ReceiverController {
  constructor() {
    this.priorityHistory = [];
    this.generalHistory = [];
    this.MAX_HISTORY = 50;
    this.lastPriorityPacketTime = 0;
  }

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

  getMetrics(req, res) {
    if (Date.now() - this.lastPriorityPacketTime > 3000) {
      this.priorityHistory = [];
    }

    let avgPriority = this.calculateAverage(this.priorityHistory);
    const avgGeneral = this.calculateAverage(this.generalHistory);
    
    const drops = apController.resetDropCounts();
    
    let priorityLoss = drops.priority > 0 ? ((drops.priority / (drops.priority + 20)) * 100).toFixed(1) : 0;
    const generalLoss = drops.general > 0 ? ((drops.general / (drops.general + 20)) * 100).toFixed(1) : 0;

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
