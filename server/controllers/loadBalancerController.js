const AccessPoint = require('../models/AccessPoint');
const EventLog = require('../models/EventLog');

const runLoadBalancer = async () => {
  const accessPoints = await AccessPoint.find();
  const logs = [];
  const zones = {};

  accessPoints.forEach(ap => {
    if (!zones[ap.zone]) zones[ap.zone] = [];
    zones[ap.zone].push(ap);
  });

  for (const [zone, aps] of Object.entries(zones)) {
    if (aps.length < 2) continue;

    let maxAp = aps[0];
    let minAp = aps[0];

    aps.forEach(ap => {
      if (ap.activeClients > maxAp.activeClients) maxAp = ap;
      if (ap.activeClients < minAp.activeClients) minAp = ap;
    });

    const loadDiff = maxAp.activeClients - minAp.activeClients;

    if (loadDiff > 20) {
      const clientsToMove = Math.floor(loadDiff / 2);

      maxAp.activeClients -= clientsToMove;
      minAp.activeClients += clientsToMove;

      await maxAp.save();
      await minAp.save();

      const logMessage = `Rebalanced ${zone}: Moved ${clientsToMove} clients from ${maxAp.name} to ${minAp.name}`;
      logs.push(logMessage);

      await EventLog.create({
        type: 'Warning',
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
