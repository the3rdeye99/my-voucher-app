const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Organization = require('./models/Organization');
const Voucher = require('./models/Voucher');
const Notification = require('./models/Notification');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'http://localhost:3000']
    : 'http://localhost:3000',
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
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
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
  res.json({ 
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add a root endpoint for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Voucher System API' });
});

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
          id: userWithoutPassword.organization._id,
          name: userWithoutPassword.organization.name
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Voucher Routes
app.get('/api/vouchers', authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.query;
    let query = {};
    
    if (staffId) {
      query.staffId = staffId;
    }
    
    const vouchers = await Voucher.find(query)
      .populate('staffId', 'name email')
      .populate('organization', 'name')
      .sort({ date: -1 });
    
    res.json(vouchers);
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ message: 'Error fetching vouchers', error: error.message });
  }
});

app.post('/api/vouchers', authenticateToken, async (req, res) => {
  try {
    console.log('Received voucher creation request:', req.body);
    const { staffId, staffName, purpose, description, amount, neededBy, organization } = req.body;
    
    // Drop the problematic index if it exists
    try {
      await Voucher.collection.dropIndex('id_1');
      console.log('Successfully dropped id_1 index');
    } catch (indexError) {
      console.log('Index drop error (can be ignored if index does not exist):', indexError.message);
    }

    // Log each field for debugging
    console.log('Voucher fields:', {
      staffId,
      staffName,
      purpose,
      description,
      amount,
      neededBy,
      organization
    });

    if (!staffId || !staffName || !purpose || !description || !amount || !neededBy || !organization) {
      console.log('Missing fields:', {
        staffId: !staffId,
        staffName: !staffName,
        purpose: !purpose,
        description: !description,
        amount: !amount,
        neededBy: !neededBy,
        organization: !organization
      });
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

    // Validate staffId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      console.error('Invalid staffId:', staffId);
      return res.status(400).json({ message: 'Invalid staff ID format' });
    }

    // Validate organization is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(organization)) {
      console.error('Invalid organization ID:', organization);
      return res.status(400).json({ message: 'Invalid organization ID format' });
    }

    // Check if staff exists
    const staffExists = await User.findById(staffId);
    if (!staffExists) {
      console.error('Staff not found:', staffId);
      return res.status(400).json({ message: 'Staff not found' });
    }

    // Check if organization exists
    const orgExists = await Organization.findById(organization);
    if (!orgExists) {
      console.error('Organization not found:', organization);
      return res.status(400).json({ message: 'Organization not found' });
    }

    const voucher = new Voucher({
      staffId,
      staffName,
      purpose,
      description,
      amount: parseFloat(amount),
      neededBy: new Date(neededBy),
      organization,
      status: 'pending',
      date: new Date(),
      updatedAt: new Date()
    });

    console.log('Creating voucher:', voucher);
    await voucher.save();
    console.log('Voucher created successfully:', voucher);

    // Create notifications for admin and accountant
    const adminAndAccountant = await User.find({
      organization,
      role: { $in: ['admin', 'accountant'] }
    });

    console.log('Found admin and accountant users:', adminAndAccountant);

    for (const user of adminAndAccountant) {
      const notification = new Notification({
        message: `New voucher request from ${staffName} for ${purpose}`,
        type: 'info',
        recipient: user._id,
        organization
      });
      await notification.save();
      console.log('Created notification for user:', user._id);
    }

    res.status(201).json(voucher);
  } catch (error) {
    console.error('Error creating voucher:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error creating voucher', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.put('/api/vouchers/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        updatedAt: new Date(),
        approvedBy: req.user.name || 'Admin'
      },
      { new: true }
    );

    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    // Create notifications for accountant and the staff who created the voucher
    const accountant = await User.findOne({
      organization: voucher.organization,
      role: 'accountant'
    });

    if (accountant) {
      const accountantNotification = new Notification({
        message: `Voucher for ${voucher.purpose} has been approved by ${req.user.name}`,
        type: 'success',
        recipient: accountant._id,
        organization: voucher.organization
      });
      await accountantNotification.save();
    }

    // Notify the staff who created the voucher
    const staffNotification = new Notification({
      message: `Your voucher request for ${voucher.purpose} has been approved`,
      type: 'success',
      recipient: voucher.staffId,
      organization: voucher.organization
    });
    await staffNotification.save();

    res.json(voucher);
  } catch (error) {
    console.error('Error approving voucher:', error);
    res.status(500).json({ message: 'Error approving voucher', error: error.message });
  }
});

app.put('/api/vouchers/:id/pay', authenticateToken, async (req, res) => {
  if (req.user.role !== 'accountant') {
    return res.status(403).json({ message: 'Accountant access required' });
  }

  try {
    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'paid',
        updatedAt: new Date(),
        paidBy: req.user.name || 'Accountant'
      },
      { new: true }
    );

    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    // Create notifications for admin and the staff who created the voucher
    const admin = await User.findOne({
      organization: voucher.organization,
      role: 'admin'
    });

    if (admin) {
      const adminNotification = new Notification({
        message: `Voucher for ${voucher.purpose} has been marked as paid by ${req.user.name}`,
        type: 'success',
        recipient: admin._id,
        organization: voucher.organization
      });
      await adminNotification.save();
    }

    // Notify the staff who created the voucher
    const staffNotification = new Notification({
      message: `Your voucher request for ${voucher.purpose} has been paid`,
      type: 'success',
      recipient: voucher.staffId,
      organization: voucher.organization
    });
    await staffNotification.save();

    res.json(voucher);
  } catch (error) {
    console.error('Error marking voucher as paid:', error);
    res.status(500).json({ message: 'Error marking voucher as paid', error: error.message });
  }
});

// User Routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('organization', 'name email');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Add user creation endpoint
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, organization } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role || !organization) {
      return res.status(400).json({
        message: 'Missing required fields',
        details: {
          name: !name,
          email: !email,
          password: !password,
          role: !role,
          organization: !organization
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      organization
    });

    await user.save();

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Organization Routes
app.get('/api/organizations', authenticateToken, async (req, res) => {
  try {
    const organizations = await Organization.find();
    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Error fetching organizations', error: error.message });
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

// Export the Express API
module.exports = app; 