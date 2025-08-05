const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

// Only Admin can add agents
router.post('/add', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

  console.log(req.body);
  
  const { name, email, mobileNumber, password } = req.body;
  if (!name || !email || !mobileNumber || !password) return res.status(400).json({ message: 'All fields required' });

  try {
    // Check if email exists
    let agent = await User.findOne({ email });
    if (agent) return res.status(400).json({ message: 'Agent already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    agent = new User({ name, email, password: hashedPassword, role: 'agent', mobileNumber });
    await agent.save();

    res.json({ message: 'Agent created successfully', agent });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Get all agents:
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

  try {
    const agents = await User.find({ role: 'agent' }).select('-password');
    res.json(agents);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
