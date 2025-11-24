const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const trafficGenerator = require('./utils/trafficGenerator');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-campus-wifi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/network', require('./routes/network'));
app.use('/api/simulation', require('./routes/simulation'));

app.get('/', (req, res) => {
  res.send('Smart Campus Wi-Fi API is running');
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  
  trafficGenerator.start();

  const loadBalancerController = require('./controllers/loadBalancerController');
  setInterval(async () => {
    try {
      const logs = await loadBalancerController.runLoadBalancer();
      if (logs.length > 0) {
        console.log('🔄 Auto-Rebalanced:', logs);
      }
    } catch (err) {
      console.error('Auto-Rebalance Error:', err.message);
    }
  }, 10000);
});
