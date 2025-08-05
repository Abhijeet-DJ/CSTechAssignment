// Run this script separately once to create admin user:

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/user');
const connectDB = require('./controllers/connectDB');

const createAdmin = async () => {
  await connectDB();

  const adminExists = await User.findOne({ email: 'admin@example.com' });
  if (adminExists) {
    console.log('Admin already exists');
    process.exit();
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const admin = new User({
    name: 'Admin User',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'admin'
  });

  await admin.save();
  console.log('Admin user created');
  process.exit();
};

createAdmin();
