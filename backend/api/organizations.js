const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const Organization = require('../models/Organization');

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
      console.log('Fetching organizations...');
      const organizations = await Organization.find();
      console.log(`Found ${organizations.length} organizations`);
      return res.json(organizations);
    }

    // Handle POST request
    if (req.method === 'POST') {
      console.log('Creating new organization...');
      const { name, email, address, phone } = req.body;
      
      // Validate required fields
      if (!name || !email) {
        console.error('Missing required fields:', { name, email });
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if organization already exists
      const existingOrg = await Organization.findOne({ email });
      if (existingOrg) {
        console.error('Organization already exists:', email);
        return res.status(400).json({ message: 'Organization already exists' });
      }
      
      const organization = new Organization({
        name,
        email,
        address,
        phone
      });

      await organization.save();
      console.log('Organization created successfully:', organization._id);
      return res.status(201).json(organization);
    }

    // Handle PUT request
    if (req.method === 'PUT') {
      const { id } = req.params;
      console.log('Updating organization:', id);
      const updates = req.body;
      
      const organization = await Organization.findByIdAndUpdate(
        id,
        updates,
        { new: true }
      );
      
      if (!organization) {
        console.error('Organization not found:', id);
        return res.status(404).json({ message: 'Organization not found' });
      }
      
      console.log('Organization updated successfully:', id);
      return res.json(organization);
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      const { id } = req.params;
      console.log('Deleting organization:', id);
      
      const organization = await Organization.findByIdAndDelete(id);
      
      if (!organization) {
        console.error('Organization not found:', id);
        return res.status(404).json({ message: 'Organization not found' });
      }
      
      console.log('Organization deleted successfully:', id);
      return res.json({ message: 'Organization deleted successfully' });
    }

    // If method is not supported
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Organization operation error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}; 