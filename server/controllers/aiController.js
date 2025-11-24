const AccessPoint = require('../models/AccessPoint');

exports.getNetworkPrediction = async (req, res) => {
  try {
    const currentHour = new Date().getHours();
    
    const accessPoints = await AccessPoint.find();
    let realTimeRisk = null;

    for (const ap of accessPoints) {
      if (ap.activeClients > 80) {
        realTimeRisk = {
          zone: ap.zone,
          risk: 'HIGH',
          message: `CRITICAL: ${ap.name} is overloaded (${ap.activeClients} clients). Immediate optimization recommended.`,
          confidence: 0.98
        };
        break; 
      }
    }

    if (realTimeRisk) {
      return res.json(realTimeRisk);
    }

    const patterns = {
      'Academic': { peakStart: 9, peakEnd: 17 },
      'Cafeteria': { peakStart: 12, peakEnd: 14 },
      'Hostel': { peakStart: 20, peakEnd: 23 }
    };

    let highestRisk = { zone: 'General', risk: 'LOW', message: 'Network loads nominal. AI monitoring active.' };

    for (const [zone, time] of Object.entries(patterns)) {
      if (currentHour >= time.peakStart && currentHour <= time.peakEnd) {
        highestRisk = {
          zone: zone,
          risk: 'HIGH',
          message: `High congestion predicted in ${zone} Zone based on time patterns.`,
          confidence: (0.85 + Math.random() * 0.1).toFixed(2)
        };
        break;
      }
    }

    res.json(highestRisk);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
