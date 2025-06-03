const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

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

// Voucher Schema
const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['active', 'used', 'expired'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  usedAt: { type: Date }
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

    // Handle GET request
    if (req.method === 'GET') {
      const vouchers = await Voucher.find()
        .populate('createdBy', 'name email')
        .populate('usedBy', 'name email')
        .populate('organization', 'name');
      
      return res.json(vouchers);
    }

    // Handle POST request
    if (req.method === 'POST') {
      const { code, amount, expiresAt, organization } = req.body;
      
      const voucher = new Voucher({
        code,
        amount,
        expiresAt,
        organization,
        createdBy: req.user._id // Assuming user is authenticated
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
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}; 