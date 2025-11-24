const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { simulateNetworkTraffic } = require('./utils/networkSimulation');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-campus-wifi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/network', require('./routes/network'));

app.get('/', (req, res) => {
  res.send('Smart Campus Wi-Fi API is running');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  
  // Start Network Simulation (runs every 5 seconds)
  setInterval(() => {
    simulateNetworkTraffic();
  }, 5000);
});
