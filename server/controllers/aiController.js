exports.getNetworkPrediction = (req, res) => {
  try {
    const currentHour = new Date().getHours();
    
    // Define critical zones and their peak hours
    const patterns = {
      'Academic': { peakStart: 9, peakEnd: 17 },  // Classes: 9am - 5pm
      'Cafeteria': { peakStart: 12, peakEnd: 14 }, // Lunch: 12pm - 2pm
      'Hostel': { peakStart: 20, peakEnd: 23 }     // Night: 8pm - 11pm
    };

    let highestRisk = { zone: 'General', risk: 'LOW', message: 'Network loads nominal. AI monitoring active.' };

    // Check each zone against current time
    for (const [zone, time] of Object.entries(patterns)) {
      if (currentHour >= time.peakStart && currentHour <= time.peakEnd) {
        // Found a high-risk zone
        highestRisk = {
          zone: zone,
          risk: 'HIGH',
          message: `High congestion predicted in ${zone} Zone.`,
          confidence: (0.85 + Math.random() * 0.1).toFixed(2) // Mock confidence 85-95%
        };
        break; // Prioritize the first critical zone found
      }
    }

    res.json(highestRisk);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
