const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB successfully');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

// Organization Schema
const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const Organization = mongoose.model('Organization', organizationSchema);

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['staff', 'accountant', 'admin'], required: true },
  password: { type: String, required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Voucher Schema
const voucherSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  purpose: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  date: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  neededBy: { type: Date, required: true },
  staffName: { type: String, required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  approvedBy: { type: String }
});

const Voucher = mongoose.model('Voucher', voucherSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['voucher', 'system', 'user'], required: true },
  read: { type: Boolean, default: false },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token:', decoded);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(403).json({ message: 'User not found' });
    }

    console.log('Found user:', {
      id: user._id.toString(),
      name: user.name,
      role: user.role,
      organization: user.organization.toString()
    });

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      organization: user.organization
    };
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  console.log('Checking admin role:', {
    userRole: req.user.role,
    userId: req.user.id
  });
  
  if (req.user.role !== 'admin') {
    console.log('Non-admin user attempted admin action:', req.user);
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Registration Route
app.post('/api/register', async (req, res) => {
  try {
    const { organizationName, adminName, email, password, role } = req.body;
    console.log('Registration attempt:', { organizationName, adminName, email, role });

    // Check if organization already exists
    const existingOrg = await Organization.findOne({ name: organizationName });
    if (existingOrg) {
      console.log('Organization already exists:', organizationName);
      return res.status(400).json({ message: 'Organization already exists' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create organization
    const organization = new Organization({ name: organizationName });
    await organization.save();
    console.log('Organization created:', organization);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const user = new User({
      name: adminName,
      email,
      password: hashedPassword,
      role,
      organization: organization._id
    });

    await user.save();
    console.log('User created:', user);

    // Return success response
    res.status(201).json({
      message: 'Organization and admin user created successfully',
      organization: {
        id: organization._id,
        name: organization.name
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    // Find user by email
    const user = await User.findOne({ email }).populate('organization');
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('User authenticated:', {
      id: user._id.toString(),
      name: user.name,
      role: user.role,
      organization: user.organization._id.toString()
    });

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Export the Express API
module.exports = app; 