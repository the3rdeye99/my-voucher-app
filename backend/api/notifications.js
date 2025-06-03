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

// Notification Schema
const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['voucher_created', 'voucher_used', 'user_created', 'system'] },
  message: { type: String, required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

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
      const { organization, user } = req.query;
      const query = {};
      
      if (organization) query.organization = organization;
      if (user) query.user = user;
      
      const notifications = await Notification.find(query)
        .populate('organization', 'name')
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
      
      return res.json(notifications);
    }

    // Handle POST request
    if (req.method === 'POST') {
      const { type, message, organization, user } = req.body;
      
      const notification = new Notification({
        type,
        message,
        organization,
        user
      });

      await notification.save();
      return res.status(201).json(notification);
    }

    // Handle PUT request (mark as read)
    if (req.method === 'PUT') {
      const { id } = req.params;
      
      const notification = await Notification.findByIdAndUpdate(
        id,
        { read: true },
        { new: true }
      );
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      return res.json(notification);
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      const { id } = req.params;
      
      const notification = await Notification.findByIdAndDelete(id);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      return res.json({ message: 'Notification deleted successfully' });
    }

    // If method is not supported
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Notification operation error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}; 