const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// MongoDB Connection
let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  try {
    const client = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    cachedDb = client;
    console.log('Connected to MongoDB successfully');
    return client;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Organization Schema
const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  adminName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Organization = mongoose.model('Organization', organizationSchema);

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  name: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Handle GET request for health check
  if (req.method === 'GET') {
    return res.json({ 
      status: 'ok',
      message: 'Register endpoint is available',
      methods: ['POST'],
      timestamp: new Date().toISOString()
    });
  }

  // Only allow POST requests for registration
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to MongoDB
    await connectDB();

    const { email, password, organizationName, adminName } = req.body;

    // Validate input
    if (!email || !password || !organizationName || !adminName) {
      return res.status(400).json({ 
        message: 'Email, password, organization name, and admin name are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create organization
    const organization = new Organization({
      name: organizationName,
      adminName: adminName
    });
    await organization.save();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      role: 'admin', // First user is admin
      organization: organization._id,
      name: adminName
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        organizationId: organization._id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user info and token
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        organization: {
          id: organization._id,
          name: organization.name
        }
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}; 