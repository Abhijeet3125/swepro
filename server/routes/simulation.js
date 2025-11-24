const express = require('express');
const router = express.Router();
const apController = require('../controllers/apController');
const receiverController = require('../controllers/receiverController');

// Ingress (Traffic Generator -> AP)
router.post('/ingress', (req, res) => apController.handleIngress(req, res));

// Egress/Receive (AP -> Receiver)
router.post('/receive', (req, res) => receiverController.receivePacket(req, res));

// Metrics (Frontend -> Receiver)
router.get('/metrics', (req, res) => receiverController.getMetrics(req, res));

module.exports = router;
