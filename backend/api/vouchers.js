const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Organization = require('../models/Organization');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

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

// Voucher Schema
const voucherSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  purpose: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffName: { type: String, required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  date: { type: Date, default: Date.now },
  neededBy: { type: Date, required: true },
  updatedAt: { type: Date, default: Date.now },
  approvedBy: { type: String }
});

const Voucher = mongoose.model('Voucher', voucherSchema);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    // Connect to MongoDB
    await connectDB();

    // Apply authentication middleware for all routes except OPTIONS
    if (req.method !== 'OPTIONS') {
      authenticateToken(req, res, () => {});
    }

    // Handle GET request
    if (req.method === 'GET') {
      const { staffId } = req.query;
      let query = {};
      
      // If staffId is provided, filter vouchers for that user
      if (staffId) {
        query.staffId = staffId;
      }
      
      const vouchers = await Voucher.find(query)
        .populate({
          path: 'staffId',
          model: 'User',
          select: 'name email'
        })
        .populate({
          path: 'organization',
          model: 'Organization',
          select: 'name'
        })
        .sort({ date: -1 });
      
      return res.json(vouchers);
    }

    // Handle POST request
    if (req.method === 'POST') {
      const { purpose, amount, description, neededBy, staffId, staffName, organization } = req.body;
      
      // Validate required fields
      if (!purpose || !amount || !description || !neededBy || !staffId || !staffName || !organization) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Generate a unique voucher ID
      const voucherId = `V${Date.now().toString().slice(-6)}`;
      
      const voucher = new Voucher({
        id: voucherId,
        purpose: purpose.trim(),
        amount: parseFloat(amount),
        description: description.trim(),
        status: 'pending',
        staffId,
        staffName: staffName.trim(),
        organization,
        date: new Date(),
        neededBy: new Date(neededBy),
        updatedAt: new Date()
      });

      await voucher.save();
      return res.status(201).json(voucher);
    }

    // Handle PUT request
    if (req.method === 'PUT') {
      const { id } = req.params;
      const updates = req.body;
      
      const voucher = await Voucher.findByIdAndUpdate(
        id,
        updates,
        { new: true }
      );
      
      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }
      
      return res.json(voucher);
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      const { id } = req.params;
      
      const voucher = await Voucher.findByIdAndDelete(id);
      
      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }
      
      return res.json({ message: 'Voucher deleted successfully' });
    }

    // If method is not supported
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Voucher operation error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      details: error.name === 'ValidationError' ? Object.values(error.errors).map(err => err.message) : undefined
    });
  }
}; 