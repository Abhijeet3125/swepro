const AccessPoint = require('../models/AccessPoint');

exports.triggerEvent = async (req, res) => {
  try {
    const { eventType } = req.body;
    
    if (!eventType) {
      return res.status(400).json({ msg: 'eventType is required' });
    }

    const accessPoints = await AccessPoint.find();
    const zoneTotals = {};

    switch (eventType) {
      case 'LUNCH_BREAK':
        // Decrease Academic by 40%
        const academicAPs = accessPoints.filter(ap => ap.zone === 'Academic');
        for (const ap of academicAPs) {
          ap.activeClients = Math.max(0, Math.floor(ap.activeClients * 0.6));
          await ap.save();
        }

        // Increase Cafeteria by 40%
        const cafeteriaAPs = accessPoints.filter(ap => ap.zone === 'Cafeteria');
        for (const ap of cafeteriaAPs) {
          ap.activeClients += Math.floor(Math.random() * 40) + 30; // Add 30-70 clients
          await ap.save();
        }
        break;

      case 'CLASSES_START':
        // Clear Hostel & Cafeteria
        const hostelAPs = accessPoints.filter(ap => ap.zone === 'Hostel');
        const cafeteriaAPsStart = accessPoints.filter(ap => ap.zone === 'Cafeteria');
        
        for (const ap of [...hostelAPs, ...cafeteriaAPsStart]) {
          ap.activeClients = Math.floor(Math.random() * 5); // < 5 clients
          await ap.save();
        }

        // Spike Academic to 80-100 clients
        const academicAPsStart = accessPoints.filter(ap => ap.zone === 'Academic');
        for (const ap of academicAPsStart) {
          ap.activeClients = Math.floor(Math.random() * 21) + 80; // 80-100 clients
          await ap.save();
        }
        break;

      case 'NIGHT_TIME':
        // Clear Academic & Cafeteria
        const academicAPsNight = accessPoints.filter(ap => ap.zone === 'Academic');
        const cafeteriaAPsNight = accessPoints.filter(ap => ap.zone === 'Cafeteria');
        
        for (const ap of [...academicAPsNight, ...cafeteriaAPsNight]) {
          ap.activeClients = Math.floor(Math.random() * 5); // < 5 clients
          await ap.save();
        }

        // Increase Hostel to medium-high
        const hostelAPsNight = accessPoints.filter(ap => ap.zone === 'Hostel');
        for (const ap of hostelAPsNight) {
          ap.activeClients = Math.floor(Math.random() * 31) + 50; // 50-80 clients
          await ap.save();
        }
        break;

      default:
        return res.status(400).json({ msg: 'Invalid eventType' });
    }

    // Calculate zone totals
    const updatedAPs = await AccessPoint.find();
    updatedAPs.forEach(ap => {
      if (!zoneTotals[ap.zone]) zoneTotals[ap.zone] = 0;
      zoneTotals[ap.zone] += ap.activeClients;
    });

    res.json({ 
      success: true, 
      eventType, 
      zoneTotals 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
