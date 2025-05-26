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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kfc-voucher', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB successfully');
  // Start the server only after MongoDB connection is established
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit the process if MongoDB connection fails
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
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
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

// Get all users (for debugging)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().populate('organization');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email }).populate('organization');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data (excluding password) and token
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ 
      token,
      user: {
        id: userWithoutPassword._id,
        name: userWithoutPassword.name,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role,
        organization: {
          _id: userWithoutPassword.organization._id,
          name: userWithoutPassword.organization.name
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all vouchers
app.get('/api/vouchers', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};
    
    // If user is staff, they can only see their own vouchers
    if (req.user.role === 'staff') {
      query.staffId = req.user.id;
    }
    // If userId is provided and user is admin/accountant, filter vouchers for that user
    else if (userId && (req.user.role === 'admin' || req.user.role === 'accountant')) {
      query.staffId = userId;
    }
    
    const vouchers = await Voucher.find(query)
      .populate('staffId', 'name email')
      .populate('organization', 'name')
      .sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ message: 'Error fetching vouchers', error: error.message });
  }
});

// Create voucher
app.post('/api/vouchers', async (req, res) => {
  try {
    console.log('Received voucher creation request:', req.body);
    
    const { purpose, amount, description, neededBy, staffId, staffName, organization } = req.body;
    
    // Log each field for debugging
    console.log('Received fields:', {
      purpose: { value: purpose, type: typeof purpose },
      amount: { value: amount, type: typeof amount },
      description: { value: description, type: typeof description },
      neededBy: { value: neededBy, type: typeof neededBy },
      staffId: { value: staffId, type: typeof staffId },
      staffName: { value: staffName, type: typeof staffName },
      organization: { value: organization, type: typeof organization }
    });
    
    // Validate required fields
    const missingFields = [];
    if (!purpose) missingFields.push('purpose');
    if (!amount) missingFields.push('amount');
    if (!description) missingFields.push('description');
    if (!neededBy) missingFields.push('neededBy');
    if (!staffId) missingFields.push('staffId');
    if (!staffName) missingFields.push('staffName');
    if (!organization) missingFields.push('organization');

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          missingFields,
          receivedFields: {
            purpose: !!purpose,
            amount: !!amount,
            description: !!description,
            neededBy: !!neededBy,
            staffId: !!staffId,
            staffName: !!staffName,
            organization: !!organization
          }
        }
      });
    }

    // Generate a unique voucher ID
    const voucherId = `V${Date.now().toString().slice(-6)}`;
    
    // Create new voucher
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

    console.log('Attempting to save voucher:', voucher);
    const savedVoucher = await voucher.save();
    console.log('Voucher saved successfully:', savedVoucher);

    res.status(201).json(savedVoucher);
  } catch (error) {
    console.error('Error creating voucher:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      message: 'Error creating voucher', 
      error: error.message 
    });
  }
});

app.put('/api/vouchers/:id/approve', async (req, res) => {
  try {
    const voucher = await Voucher.findOneAndUpdate(
      { id: req.params.id },
      { status: 'approved' },
      { new: true }
    );
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }
    res.json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/vouchers/:id/reject', async (req, res) => {
  try {
    const voucher = await Voucher.findOneAndUpdate(
      { id: req.params.id },
      { 
        status: 'rejected',
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }
    res.json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/vouchers/:id/pay', async (req, res) => {
  try {
    const voucher = await Voucher.findOneAndUpdate(
      { id: req.params.id },
      { 
        status: 'paid',
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }
    res.json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Routes
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, role, password, organization } = req.body;
    
    // Validate required fields
    if (!name || !email || !role || !password || !organization) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate role
    if (!['staff', 'accountant', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Verify organization exists
    const organizationExists = await Organization.findById(organization);
    if (!organizationExists) {
      return res.status(400).json({ message: 'Invalid organization' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with organization
    const user = new User({
      name,
      email,
      role,
      password: hashedPassword,
      organization
    });

    const savedUser = await user.save();
    
    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete all users
app.delete('/api/users', async (req, res) => {
  try {
    await User.deleteMany({});
    res.status(200).json({ message: 'All users deleted successfully' });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ message: 'Error deleting users', error: error.message });
  }
});

// Notification endpoints
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipient: req.user.id },
        { organization: req.user.organization }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

app.post('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { message, type, recipient } = req.body;
    
    const notification = new Notification({
      message,
      type,
      recipient,
      organization: req.user.organization
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

// Export vouchers endpoint
app.get('/api/vouchers/export', authenticateToken, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    
    // Apply filters if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { staffName: { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } }
      ];
    }
    
    const vouchers = await Voucher.find(query)
      .populate('staffId', 'name email')
      .populate('organization', 'name')
      .sort({ createdAt: -1 });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vouchers');

    // Add headers
    worksheet.columns = [
      { header: 'Voucher ID', key: 'id', width: 15 },
      { header: 'Staff Name', key: 'staffName', width: 20 },
      { header: 'Purpose', key: 'purpose', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Needed By', key: 'neededBy', width: 20 },
      { header: 'Description', key: 'description', width: 40 }
    ];

    // Add data rows
    vouchers.forEach(voucher => {
      worksheet.addRow({
        id: voucher.id,
        staffName: voucher.staffName,
        purpose: voucher.purpose,
        amount: voucher.amount,
        status: voucher.status,
        date: new Date(voucher.date).toLocaleDateString(),
        neededBy: new Date(voucher.neededBy).toLocaleDateString(),
        description: voucher.description
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=vouchers-export-${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting vouchers:', error);
    res.status(500).json({ message: 'Error exporting vouchers', error: error.message });
  }
}); 