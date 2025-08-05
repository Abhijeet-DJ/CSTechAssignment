const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const auth = require('../middleware/auth');
const User = require('../models/user');
const Task = require('../models/Task');
const fs = require('fs');
const path = require('path');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only csv, xlsx, axls
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.csv', '.xlsx', '.axls'].includes(ext)) cb(null, true);
    else cb(new Error('File type not supported'), false);
  }
});

// Upload and distribute
router.post('/upload', auth, upload.single('list'), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

  // Validate file exists
  if (!req.file) return res.status(400).json({ message: 'File is required' });

  try {
    // Parse CSV - only handle CSV here (xlsx support would require advanced libraries)
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv(['FirstName', 'Phone', 'Notes']))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        fs.unlinkSync(req.file.path); // remove file after processing

        // Validate format (at least the keys)
        for (let item of results) {
          if (!item.FirstName || !item.Phone) {
            return res.status(400).json({ message: 'CSV format invalid. FirstName and Phone required.' });
          }
        }

        // Get 5 agents
        const agents = await User.find({ role: 'agent' });
        if (agents.length < 5) return res.status(400).json({ message: 'At least 5 agents required.' });

        // Distribute tasks equally + leftover sequentially
        const tasksToSave = [];
        const n = results.length;
        const baseCount = Math.floor(n / 5);
        let leftover = n % 5;

        let index = 0;
        for (let i = 0; i < 5; i++) {
          let count = baseCount + (leftover > 0 ? 1 : 0);
          if (leftover > 0) leftover--;

          for (let j = 0; j < count; j++) {
            tasksToSave.push(new Task({
              firstName: results[index].FirstName,
              phone: results[index].Phone,
              notes: results[index].Notes || '',
              assignedTo: agents[i]._id
            }));
            index++;
          }
        }

        await Task.insertMany(tasksToSave);

        res.json({ message: 'Tasks distributed successfully' });
      });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get tasks per agent (Admin only)
router.get('/byAgent/:agentId', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

  try {
    const tasks = await Task.find({ assignedTo: req.params.agentId });
    res.json(tasks);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
