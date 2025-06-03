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
  origin: ['http://localhost:3000', 'https://gaage-app.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Don't exit the process in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Connect to MongoDB
connectDB();

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Add a root endpoint for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Voucher System API' });
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Add 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
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
        name: user.name,
        organization: user.organization._id.toString()
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data (excluding password) and token
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ 
      token,
      user: {
        id: userWithoutPassword._id.toString(),
        name: userWithoutPassword.name,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role,
        organization: {
          id: userWithoutPassword.organization._id.toString(),
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

// Helper function to create notifications
const createNotification = async (message, type, recipients, organization) => {
  try {
    const notifications = recipients.map(recipientId => ({
      message,
      type,
      recipient: recipientId,
      organization
    }));
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
};

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

    // Create notifications for admin and accountant
    const adminAndAccountant = await User.find({
      organization,
      role: { $in: ['admin', 'accountant'] }
    }).select('_id');

    await createNotification(
      `New voucher ${voucherId} created by ${staffName}`,
      'voucher',
      adminAndAccountant.map(user => user._id),
      organization
    );

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

app.put('/api/vouchers/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Approving voucher:', {
      voucherId: req.params.id,
      user: req.user
    });

    const voucher = await Voucher.findOneAndUpdate(
      { id: req.params.id },
      { 
        status: 'approved',
        updatedAt: new Date(),
        approvedBy: req.user.name
      },
      { new: true }
    );
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    console.log('Voucher approved:', {
      voucherId: voucher.id,
      approvedBy: voucher.approvedBy,
      status: voucher.status
    });

    // Create notifications for accountant and staff
    const accountantAndStaff = await User.find({
      organization: voucher.organization,
      $or: [
        { role: 'accountant' },
        { _id: voucher.staffId }
      ]
    }).select('_id');

    await createNotification(
      `Voucher ${voucher.id} has been approved by ${req.user.name}`,
      'voucher',
      accountantAndStaff.map(user => user._id),
      voucher.organization
    );

    res.json(voucher);
  } catch (error) {
    console.error('Error approving voucher:', error);
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

    // Create notifications for admin and staff
    const adminAndStaff = await User.find({
      organization: voucher.organization,
      $or: [
        { role: 'admin' },
        { _id: voucher.staffId }
      ]
    }).select('_id');

    await createNotification(
      `Voucher ${voucher.id} has been marked as paid`,
      'voucher',
      adminAndStaff.map(user => user._id),
      voucher.organization
    );

    res.json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Routes
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, role, password, organization } = req.body;
    
    console.log('Creating user request:', {
      body: {
        ...req.body,
        password: '[REDACTED]'
      },
      user: req.user,
      headers: req.headers
    });
    
    // Validate required fields
    if (!name || !email || !role || !password || !organization) {
      console.log('Missing required fields:', { 
        name: !!name, 
        email: !!email, 
        role: !!role, 
        hasPassword: !!password, 
        organization: !!organization 
      });
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate role
    if (!['staff', 'accountant', 'admin'].includes(role)) {
      console.log('Invalid role:', role);
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Verify organization exists
    const organizationExists = await Organization.findById(organization);
    if (!organizationExists) {
      console.log('Organization not found:', organization);
      return res.status(400).json({ message: 'Invalid organization' });
    }

    // Find the organization's first admin (main admin)
    const mainAdmin = await User.findOne({
      organization: organization,
      role: 'admin'
    }).sort({ createdAt: 1 });

    console.log('Main admin check:', {
      mainAdminId: mainAdmin?._id.toString(),
      currentUserId: req.user.id,
      isMainAdmin: mainAdmin && mainAdmin._id.toString() === req.user.id,
      organization: organization,
      currentUserRole: req.user.role
    });

    // Check if the current user is the main admin
    const isMainAdmin = mainAdmin && mainAdmin._id.toString() === req.user.id;

    // Only allow main admin to create users
    if (!isMainAdmin) {
      console.log('Non-main admin attempted to create user:', {
        currentUser: req.user,
        mainAdmin: mainAdmin?._id.toString(),
        currentUserRole: req.user.role
      });
      return res.status(403).json({ message: 'Only the main admin can create new users' });
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
      organization: organization
    });

    const savedUser = await user.save();
    
    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    console.log('User created successfully:', {
      userId: savedUser._id,
      name: savedUser.name,
      role: savedUser.role,
      organization: savedUser.organization
    });
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Find the user being updated
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the organization's first admin (main admin)
    const mainAdmin = await User.findOne({
      organization: userToUpdate.organization,
      role: 'admin'
    }).sort({ createdAt: 1 });

    // Check if the current user is the main admin
    const isMainAdmin = mainAdmin && mainAdmin._id.toString() === req.user.id;

    // If trying to update name and not the main admin, remove name from update
    if (req.body.name && !isMainAdmin) {
      delete req.body.name;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Remove password from response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
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

app.delete('/api/notifications/clear-all', authenticateToken, async (req, res) => {
  try {
    await Notification.deleteMany({
      $or: [
        { recipient: req.user.id },
        { organization: req.user.organization }
      ]
    });
    
    res.json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Failed to clear notifications' });
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
app.post('/api/vouchers/export', authenticateToken, async (req, res) => {
  try {
    const { vouchers, summary } = req.body;

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // Add summary worksheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 20 },
      { header: 'Value', key: 'value', width: 30 }
    ];
    
    // Add summary data
    summarySheet.addRows([
      { metric: 'Total Amount Paid', value: `₦${summary.totalAmountPaid.toLocaleString()}` },
      { metric: 'Total Vouchers', value: summary.totalVouchers },
      { metric: 'Paid Vouchers', value: summary.paidVouchers },
      { metric: 'Date Range', value: summary.dateRange },
      { metric: 'Export Date', value: summary.exportDate }
    ]);

    // Style summary sheet
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add vouchers worksheet
    const vouchersSheet = workbook.addWorksheet('Vouchers');
    vouchersSheet.columns = [
      { header: 'Voucher ID', key: 'id', width: 15 },
      { header: 'Staff Name', key: 'staffName', width: 20 },
      { header: 'Purpose', key: 'purpose', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Needed By', key: 'neededBy', width: 20 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Approved By', key: 'approvedBy', width: 20 }
    ];

    // Add voucher data
    vouchers.forEach(voucher => {
      vouchersSheet.addRow({
        id: voucher.id,
        staffName: voucher.staffName,
        purpose: voucher.purpose,
        amount: `₦${voucher.amount.toLocaleString()}`,
        status: voucher.status,
        date: new Date(voucher.date).toLocaleDateString(),
        neededBy: new Date(voucher.neededBy).toLocaleDateString(),
        description: voucher.description,
        approvedBy: voucher.approvedBy || 'Not Approved'
      });
    });

    // Style vouchers sheet
    vouchersSheet.getRow(1).font = { bold: true };
    vouchersSheet.getRow(1).fill = {
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

// Export the Express API
module.exports = app; 