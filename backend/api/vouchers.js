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

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
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
  approvedBy: { type: String, required: false },
  paidBy: { type: String, required: false }
});

// Drop the old code index if it exists
const dropOldIndex = async () => {
  try {
    await Voucher.collection.dropIndex('code_1');
    console.log('Successfully dropped old code index');
  } catch (error) {
    if (error.code !== 26) { // Ignore if index doesn't exist
      console.error('Error dropping old index:', error);
    }
  }
};

// Initialize the model and drop old index
const Voucher = mongoose.model('Voucher', voucherSchema);
dropOldIndex();

// Generate a unique voucher code
const generateVoucherCode = async () => {
  const prefix = 'V';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

module.exports = async (req, res) => {
  // Set CORS headers for all responses
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
      
      console.log('Fetching vouchers with query:', query);
      
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
        .select('id purpose amount description status staffId staffName organization date neededBy updatedAt approvedBy paidBy') // Explicitly select all fields
        .sort({ date: -1 });
      
      console.log('Fetched vouchers:', vouchers.map(v => ({
        id: v.id,
        status: v.status,
        approvedBy: v.approvedBy
      })));
      
      return res.json(vouchers);
    }

    // Handle POST request
    if (req.method === 'POST') {
      try {
        const { staffId, staffName, purpose, description, amount, neededBy, file, organization } = req.body;
        
        // Validate required fields
        if (!staffId || !staffName || !purpose || !description || !amount || !neededBy || !organization) {
          return res.status(400).json({ 
            message: 'Missing required fields',
            details: {
              staffId: !staffId,
              staffName: !staffName,
              purpose: !purpose,
              description: !description,
              amount: !amount,
              neededBy: !neededBy,
              organization: !organization
            }
          });
        }

        // Generate a unique voucher ID
        const voucherId = await generateVoucherCode();
        
        const voucher = new Voucher({
          id: voucherId,
          staffId,
          staffName,
          purpose,
          description,
          amount: parseFloat(amount),
          neededBy: new Date(neededBy),
          file,
          organization,
          status: 'pending',
          date: new Date(),
          updatedAt: new Date()
        });

        await voucher.save();
        console.log('Voucher created successfully:', { id: voucher.id, staffName: voucher.staffName });
        return res.status(201).json(voucher);
      } catch (error) {
        console.error('Error creating voucher:', error);
        if (error.code === 11000) {
          return res.status(400).json({ 
            message: 'Duplicate voucher ID generated. Please try again.',
            error: error.message 
          });
        }
        return res.status(500).json({ 
          message: 'Error creating voucher',
          error: error.message,
          details: error.name === 'ValidationError' ? Object.values(error.errors).map(err => err.message) : undefined
        });
      }
    }

    // Handle PUT request for voucher approval
    if (req.method === 'PUT' && req.url.includes('/approve')) {
      // Check admin role
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Extract voucher ID from URL
      const urlParts = req.url.split('/');
      const voucherId = urlParts[urlParts.length - 2]; // Get the ID before 'approve'
      
      console.log('Approving voucher:', {
        url: req.url,
        urlParts,
        voucherId,
        user: req.user
      });

      const voucher = await Voucher.findOneAndUpdate(
        { id: voucherId },
        { 
          status: 'approved',
          updatedAt: new Date(),
          approvedBy: req.user.name || 'Admin'
        },
        { new: true, runValidators: true }
      );

      if (!voucher) {
        console.log('Voucher not found:', voucherId);
        return res.status(404).json({ message: 'Voucher not found' });
      }

      console.log('Voucher approved successfully:', {
        id: voucher.id,
        status: voucher.status,
        approvedBy: voucher.approvedBy
      });

      // Return the updated voucher with all fields
      return res.json(voucher);
    }

    // Handle PUT request for marking voucher as paid
    if (req.method === 'PUT' && req.url.includes('/pay')) {
      // Check accountant role
      if (req.user.role !== 'accountant') {
        return res.status(403).json({ message: 'Accountant access required' });
      }

      // Extract voucher ID from URL
      const urlParts = req.url.split('/');
      const voucherId = urlParts[urlParts.length - 2]; // Get the ID before 'pay'
      
      console.log('Marking voucher as paid:', {
        url: req.url,
        urlParts,
        voucherId,
        user: req.user
      });

      // First find the voucher to preserve the approvedBy field
      const existingVoucher = await Voucher.findOne({ id: voucherId });
      if (!existingVoucher) {
        console.log('Voucher not found:', voucherId);
        return res.status(404).json({ message: 'Voucher not found' });
      }

      const voucher = await Voucher.findOneAndUpdate(
        { id: voucherId },
        { 
          status: 'paid',
          updatedAt: new Date(),
          paidBy: req.user.name || 'Accountant',
          approvedBy: existingVoucher.approvedBy // Preserve the approvedBy field
        },
        { new: true, runValidators: true }
      );

      console.log('Voucher marked as paid successfully:', {
        id: voucher.id,
        status: voucher.status,
        paidBy: voucher.paidBy,
        approvedBy: voucher.approvedBy
      });

      // Return the updated voucher with all fields
      return res.json(voucher);
    }

    // Handle other PUT requests
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