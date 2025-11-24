const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Ticket = require('../models/Ticket');

// Create Ticket
router.post('/', auth, async (req, res) => {
  const { issueType, location, description } = req.body;
  try {
    const newTicket = new Ticket({
      issueType,
      location,
      description,
      createdBy: req.user.id
    });
    const ticket = await newTicket.save();
    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get Tickets (Admin gets all, Student gets theirs)
router.get('/', auth, async (req, res) => {
  try {
    let tickets;
    if (req.user.role === 'admin') {
      tickets = await Ticket.find().populate('createdBy', ['username', 'email']);
    } else {
      tickets = await Ticket.find({ createdBy: req.user.id });
    }
    res.json(tickets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update Ticket Status (Admin only)
router.patch('/:id', auth, async (req, res) => {
  const { status } = req.body;
  try {
    let ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    ticket.status = status;
    await ticket.save();
    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
