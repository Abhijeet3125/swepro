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
        const academicAPs = accessPoints.filter(ap => ap.zone === 'Academic');
        for (const ap of academicAPs) {
          ap.activeClients = Math.max(0, Math.floor(ap.activeClients * 0.6));
          await ap.save();
        }

        const cafeteriaAPs = accessPoints.filter(ap => ap.zone === 'Cafeteria');
        for (const ap of cafeteriaAPs) {
          ap.activeClients += Math.floor(Math.random() * 40) + 30;
          await ap.save();
        }
        break;

      case 'CLASSES_START':
        const hostelAPs = accessPoints.filter(ap => ap.zone === 'Hostel');
        const cafeteriaAPsStart = accessPoints.filter(ap => ap.zone === 'Cafeteria');
        
        for (const ap of [...hostelAPs, ...cafeteriaAPsStart]) {
          ap.activeClients = Math.floor(Math.random() * 5); // < 5 clients
          await ap.save();
        }

        const academicAPsStart = accessPoints.filter(ap => ap.zone === 'Academic');
        for (const ap of academicAPsStart) {
          ap.activeClients = Math.floor(Math.random() * 21) + 80;
          await ap.save();
        }
        break;

      case 'NIGHT_TIME':
        const academicAPsNight = accessPoints.filter(ap => ap.zone === 'Academic');
        const cafeteriaAPsNight = accessPoints.filter(ap => ap.zone === 'Cafeteria');
        
        for (const ap of [...academicAPsNight, ...cafeteriaAPsNight]) {
          ap.activeClients = Math.floor(Math.random() * 5); // < 5 clients
          await ap.save();
        }

        const hostelAPsNight = accessPoints.filter(ap => ap.zone === 'Hostel');
        for (const ap of hostelAPsNight) {
          ap.activeClients = Math.floor(Math.random() * 31) + 50;
          await ap.save();
        }
        break;

      default:
        return res.status(400).json({ msg: 'Invalid eventType' });
    }

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
