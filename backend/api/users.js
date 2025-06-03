const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('../models/User');
const Organization = require('../models/Organization');
const bcrypt = require('bcryptjs');

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
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
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
      console.log('Fetching users...');
      try {
        const users = await User.find()
          .select('-password')
          .populate('organization', 'name email');
        console.log(`Found ${users.length} users`);
        return res.json(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Error fetching users', error: error.message });
      }
    }

    // Handle POST request
    if (req.method === 'POST') {
      console.log('Creating new user...');
      const { email, password, name, role, organization } = req.body;
      
      // Validate required fields
      if (!email || !password || !name) {
        console.error('Missing required fields:', { email, password, name });
        return res.status(400).json({ message: 'Missing required fields' });
      }

      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          console.error('User already exists:', email);
          return res.status(400).json({ message: 'User already exists' });
        }

        // If organization is provided, verify it exists
        if (organization) {
          const orgExists = await Organization.findById(organization);
          if (!orgExists) {
            console.error('Organization not found:', organization);
            return res.status(400).json({ message: 'Organization not found' });
          }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = new User({
          email,
          password: hashedPassword, // Use hashed password
          name,
          role,
          organization
        });

        await user.save();
        console.log('User created successfully:', user._id);
        return res.status(201).json({
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization: user.organization
        });
      } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Error creating user', error: error.message });
      }
    }

    // Handle PUT request
    if (req.method === 'PUT') {
      const { id } = req.params;
      console.log('Updating user:', id);
      const updates = req.body;
      
      try {
        // Don't allow password updates through this endpoint
        delete updates.password;
        
        // If organization is being updated, verify it exists
        if (updates.organization) {
          const orgExists = await Organization.findById(updates.organization);
          if (!orgExists) {
            console.error('Organization not found:', updates.organization);
            return res.status(400).json({ message: 'Organization not found' });
          }
        }
        
        const user = await User.findByIdAndUpdate(
          id,
          updates,
          { new: true }
        ).select('-password');
        
        if (!user) {
          console.error('User not found:', id);
          return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('User updated successfully:', id);
        return res.json(user);
      } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Error updating user', error: error.message });
      }
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      const { id } = req.params;
      console.log('Deleting user:', id);
      
      try {
        const user = await User.findByIdAndDelete(id);
        
        if (!user) {
          console.error('User not found:', id);
          return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('User deleted successfully:', id);
        return res.json({ message: 'User deleted successfully' });
      } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Error deleting user', error: error.message });
      }
    }

    // If method is not supported
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('User operation error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}; 