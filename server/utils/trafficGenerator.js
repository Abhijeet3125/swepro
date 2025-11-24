const axios = require('axios');

class TrafficGenerator {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.packetCount = 0;
  }

  start() {
    if (this.isRunning) return;
    
    console.log('Starting Traffic Generator...');
    this.isRunning = true;
    
    this.intervalId = setInterval(() => {
      this.generatePacket();
    }, 50);
  }

  stop() {
    if (!this.isRunning) return;
    
    console.log('Stopping Traffic Generator...');
    clearInterval(this.intervalId);
    this.isRunning = false;
  }

  async generatePacket() {
    try {
      this.packetCount++;
      
      const appTypes = [
        'Zoom (Video Conf)', 
        'Netflix (Streaming)', 
        'Microsoft Teams', 
        'General Browsing', 
        'YouTube',
        'Moodle (Assessment)'
      ];
      const randomApp = appTypes[Math.floor(Math.random() * appTypes.length)];
      
      const packet = {
        id: `pkt_${Date.now()}_${this.packetCount}`,
        appType: randomApp,
        timestamp: Date.now(),
        isPriority: false
      };

      await axios.post('http://localhost:5000/api/simulation/ingress', packet)
        .catch(err => {
          if (err.response && err.response.status === 503) {
          } else if (err.code !== 'ECONNREFUSED') {
            console.error('Traffic Gen Error:', err.message);
          }
        });
        
    } catch (error) {
      console.error('Error generating packet:', error.message);
    }
  }
}

module.exports = new TrafficGenerator();
