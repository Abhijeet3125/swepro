const AccessPoint = require('../models/AccessPoint');
const EventLog = require('../models/EventLog');

const runLoadBalancer = async () => {
  const accessPoints = await AccessPoint.find();
  const logs = [];
  const zones = {};

  // 1. Group APs by Zone
  accessPoints.forEach(ap => {
    if (!zones[ap.zone]) zones[ap.zone] = [];
    zones[ap.zone].push(ap);
  });

  // 2. Iterate through each zone
  for (const [zone, aps] of Object.entries(zones)) {
    if (aps.length < 2) continue; // Need at least 2 APs to balance

    // Find Max and Min Load APs
    let maxAp = aps[0];
    let minAp = aps[0];

    aps.forEach(ap => {
      if (ap.activeClients > maxAp.activeClients) maxAp = ap;
      if (ap.activeClients < minAp.activeClients) minAp = ap;
    });

    // Calculate Difference
    const loadDiff = maxAp.activeClients - minAp.activeClients;

    // 3. Threshold Check (Diff > 20)
    if (loadDiff > 20) {
      const clientsToMove = Math.floor(loadDiff / 2);

      // Move Clients
      maxAp.activeClients -= clientsToMove;
      minAp.activeClients += clientsToMove;

      // Update DB
      await maxAp.save();
      await minAp.save();

      // Log Event
      const logMessage = `Rebalanced ${zone}: Moved ${clientsToMove} clients from ${maxAp.name} to ${minAp.name}`;
      logs.push(logMessage);

      await EventLog.create({
        type: 'Warning', // Using Warning to highlight the action
        message: logMessage,
        source: 'Load Balancer'
      });
    }
  }
  return logs;
};

exports.runLoadBalancer = runLoadBalancer;

exports.optimizeNetwork = async (req, res) => {
  try {
    const logs = await runLoadBalancer();
    res.json({ success: true, logs: logs.length > 0 ? logs : ['Network is balanced. No actions taken.'] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
