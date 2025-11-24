const AccessPoint = require('../models/AccessPoint');
const EventLog = require('../models/EventLog');
const QoSPolicy = require('../models/QoSPolicy');

const simulateNetworkTraffic = async () => {
  try {
    const aps = await AccessPoint.find();
    const activePolicies = await QoSPolicy.find({ isActive: true });
    
    // Check if any High Priority policy is active
    const highPriorityActive = activePolicies.some(p => p.priority === 'High');

    for (const ap of aps) {
      // 1. Simulate Load and Client Changes
      // Randomly fluctuate load by -10% to +10%
      const loadChange = Math.floor(Math.random() * 21) - 10;
      let newLoad = ap.load + loadChange;
      
      // Apply QoS Logic: If High Priority is active, prevent bottlenecks by capping load
      // This simulates the system "reconfiguring network traffic" to prioritize VIPs
      if (highPriorityActive) {
        // "Optimization" effect: Cap load at 75% to ensure headroom for critical traffic
        // Or reduce load slightly to show effect
        if (newLoad > 75) {
          newLoad = 75 - Math.floor(Math.random() * 5); 
        }
      }

      newLoad = Math.max(0, Math.min(100, newLoad));

      // Calculate active clients based on load
      const newClients = Math.floor(newLoad * (Math.random() * 1.5 + 0.5));
      
      // Calculate traffic rate
      const newTraffic = Math.floor(newClients * (Math.random() * 5 + 1)) + ' Mbps';

      ap.load = newLoad;
      ap.activeClients = newClients;
      ap.trafficRate = newTraffic;

      // 2. Simulate Status Changes (Rarely)
      // If High Priority is active, system is more stable (0.1% chance of failure vs 1%)
      const failureChance = highPriorityActive ? 0.001 : 0.01;
      
      if (Math.random() < failureChance) {
        const oldStatus = ap.status;
        ap.status = ap.status === 'Online' ? 'Offline' : 'Online';
        
        const severity = ap.status === 'Offline' ? 'Critical' : 'Info';
        const message = ap.status === 'Offline' 
          ? `Access Point ${ap.name} went OFFLINE at ${ap.location}` 
          : `Access Point ${ap.name} is back ONLINE`;
        
        await EventLog.create({
          type: severity,
          message: message,
          source: ap.name
        });
      }

      // 3. Log High Load Events
      // If High Priority active, we shouldn't see many high load warnings
      if (newLoad > 90 && Math.random() < 0.1) {
         await EventLog.create({
          type: 'Warning',
          message: `High traffic load detected on ${ap.name} (${newLoad}%)`,
          source: ap.name
        });
      }

      await ap.save();
    }
  } catch (err) {
    console.error('Simulation Error:', err);
  }
};

module.exports = { simulateNetworkTraffic };
