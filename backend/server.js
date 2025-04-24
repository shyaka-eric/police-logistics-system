const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');
const userRoutes = require('./routes/users');
const User = require('./models/User');  // Import User model
const Issuance = require('./models/Issuance'); // Import Issuance model
const Log = require('./models/Log');
const json2csv = require('json2csv').parse;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const authRoutes = require('./routes/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and Excel files
    if (
      file.mimetype.startsWith('image/') || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only image and Excel files are allowed'));
    }
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  abortOnLimit: true
}));
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/logistics', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Auth routes (unprotected)
app.use('/api/auth', authRoutes);

// Request Schema
const requestSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  purpose: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  adminRemark: String
});

// Stock Schema
const stockSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  minQuantity: { type: Number, required: true, default: 10 },
  location: { type: String, required: true },
  description: String,
  expirationDate: Date,
  status: { 
    type: String, 
    enum: ['in-stock', 'in-use', 'under-repair', 'damaged'],
    default: 'in-stock'
  },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Repair Request Schema
const repairRequestSchema = new mongoose.Schema({
  location: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    required: true 
  },
  photoUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminRemark: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Under Repair Schema
const underRepairSchema = new mongoose.Schema({
  repairRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'RepairRequest', required: true },
  location: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    required: true 
  },
  photoUrl: { type: String, required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  remarks: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Request = mongoose.model('Request', requestSchema);
const Stock = mongoose.model('Stock', stockSchema);
const Category = mongoose.model('Category', categorySchema);
const Notification = mongoose.model('Notification', notificationSchema);
const RepairRequest = mongoose.model('RepairRequest', repairRequestSchema);
const UnderRepair = mongoose.model('UnderRepair', underRepairSchema);

// JWT verification middleware for protected routes
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    
    // Fetch user and attach to request
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check user role
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    console.log('Role check details:', {
      userRole: req.user.role,
      allowedRoles,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user._id,
      userRoleLowerCase: req.user.role.toLowerCase(),
      allowedRolesLowerCase: allowedRoles.map(r => r.toLowerCase())
    });

    // Normalize roles for comparison (handle 'UnitLeader' vs 'Unitleader' vs 'unitLeader' etc)
    const userRole = req.user.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      console.log('Access denied details:', {
        userRole,
        normalizedAllowedRoles,
        endpoint: req.originalUrl,
        matches: normalizedAllowedRoles.includes(userRole)
      });
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        debug: {
          userRole: req.user.role,
          allowedRoles,
          normalized: {
            userRole,
            allowedRoles: normalizedAllowedRoles
          }
        }
      });
    }
    next();
  };
};

// Role-specific middleware functions
const isAdmin = checkRole(['Admin']);
const isLogisticsOfficer = checkRole(['LogisticsOfficer']);
const isSystemAdmin = checkRole(['SystemAdmin']);
const isUnitLeader = checkRole(['UnitLeader']);

// Logging middleware
const logActivity = async (req, res, next) => {
  console.log('🔍 Logging middleware triggered for:', req.method, req.originalUrl);

  // Create a copy of the original methods
  const originalJson = res.json;
  const originalSend = res.send;
  const originalEnd = res.end;
  let responseBody;

  // Override json method
  res.json = function (data) {
    responseBody = data;
    return originalJson.call(this, data);
  };

  // Override send method
  res.send = function (data) {
    responseBody = data;
    return originalSend.call(this, data);
  };

  // Call next first to let the request complete
  next();

  // After response is sent, create the log
  res.on('finish', async () => {
    try {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Get user details for logging
        const user = await User.findById(req.userId).select('name role email');

        // Determine the module from the URL
        let module = req.originalUrl.split('/')[2];
        // Clean up module name
        if (module && module.includes('?')) {
          module = module.split('?')[0];
        }
        
        // Determine action type and description
        let action;
        let details;
        
        switch (req.method) {
          case 'GET':
            action = 'view';
            details = `Viewed ${module} data`;
            break;
          case 'POST':
            action = 'create';
            details = `Created new ${module} entry`;
            break;
          case 'PUT':
          case 'PATCH':
            action = 'update';
            details = `Updated ${module} data`;
            break;
          case 'DELETE':
            action = 'delete';
            details = `Deleted ${module} entry`;
            break;
          default:
            action = 'other';
            details = `Performed ${req.method} operation on ${module}`;
        }

        // Add specific details based on the request
        if (req.params.id) {
          details += ` (ID: ${req.params.id})`;
        }
        if (req.query) {
          const queryStr = Object.entries(req.query)
            .map(([key, value]) => `${key}=${value}`)
            .join(', ');
          if (queryStr) {
            details += ` with parameters: ${queryStr}`;
          }
        }

        const log = new Log({
          timestamp: new Date(),
          action,
          module,
          details,
          performedBy: req.userId,
          userRole: user?.role || 'Unknown',
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
          metadata: {
            body: req.body,
            params: req.params,
            query: req.query,
            response: responseBody
          }
        });

        await log.save();
        console.log('✅ Log entry created:', {
          id: log._id,
          action,
          module,
          userId: req.userId,
          role: user?.role
        });
      } else {
        console.log('⚠️ Skipping log for non-successful request:', {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode
        });
      }
    } catch (error) {
      console.error('❌ Error creating log:', error);
    }
  });
};

// Apply logging middleware to all protected routes
app.use('/api', verifyToken, logActivity);

// Protected routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Routes
app.get('/api/user/current', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});

app.post('/api/requests', verifyToken, async (req, res) => {
  try {
    const { itemName, quantity, unit, purpose, priority } = req.body;
    
    const request = new Request({
      itemName,
      quantity,
      unit,
      purpose,
      priority,
      requestedBy: req.userId
    });

    await request.save();
    
    res.status(201).json({
      message: 'Request created successfully',
      request
    });
  } catch (error) {
    console.error('Request creation error:', error);
    res.status(500).json({ message: 'Error creating request', error: error.message });
  }
});

app.get('/api/requests', verifyToken, async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log('Sending requests:', requests.length);
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
});

app.get('/api/user/requests', verifyToken, async (req, res) => {
  try {
    const requests = await Request.find({ requestedBy: req.userId })
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ message: 'Error fetching user requests', error: error.message });
  }
});

app.get('/api/requests/check/:id', verifyToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    console.log('Checking request existence:', requestId);

    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        exists: false,
        reason: 'Invalid MongoDB ID format'
      });
    }

    // Try different methods to find the request
    const results = {
      findById: await Request.findById(requestId),
      findOne: await Request.findOne({ _id: requestId }),
      countDocuments: await Request.countDocuments({ _id: requestId }),
      rawId: requestId,
      isValid: mongoose.Types.ObjectId.isValid(requestId)
    };

    console.log('Request check results:', results);

    res.json({
      exists: results.findById !== null,
      results
    });
  } catch (error) {
    console.error('Error checking request:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/requests/:id', verifyToken, async (req, res) => {
  try {
    const { status, adminRemark } = req.body;
    
    // Debug logging
    console.log('Update Request Debug:', {
      requestId: req.params.id,
      userRole: req.user.role,
      requestedStatus: status,
      userId: req.user._id,
      currentUserInfo: req.user
    });

    const request = await Request.findById(req.params.id).populate('requestedBy');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Debug logging for request state
    console.log('Current Request State:', {
      currentStatus: request.status,
      targetStatus: status,
      requestDetails: request
    });

    // Role-based permission check with detailed logging
    console.log('Role Check:', {
      userRole: req.user.role,
      isLogisticsOfficer: req.user.role === 'LogisticsOfficer',
      isAdmin: req.user.role === 'Admin',
      requestedStatus: status
    });

    // Check if user is LogisticsOfficer
    if (req.user.role === 'LogisticsOfficer') {
      if (status !== 'completed') {
        return res.status(403).json({ 
          message: 'Logistics Officers can only mark requests as completed',
          userRole: req.user.role,
          attemptedStatus: status
        });
      }
      // Check if request is approved before allowing completion
      if (request.status !== 'approved') {
        return res.status(403).json({ 
          message: 'Only approved requests can be marked as completed',
          currentStatus: request.status
        });
      }
    } 
    // Check if user is Admin
    else if (req.user.role === 'Admin') {
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(403).json({ 
          message: 'Admins can only approve or reject requests',
          attemptedStatus: status
        });
      }
    } 
    // Deny access for other roles
    else {
      return res.status(403).json({ 
        message: 'You do not have permission to update requests',
        userRole: req.user.role
      });
    }

    // If request is being completed, update stock
    if (status === 'completed') {
      // Find the stock item by exact itemName match
      const stock = await Stock.findOne({ itemName: request.itemName });
      console.log('Found stock item:', stock);

      if (!stock) {
        return res.status(400).json({ 
          message: 'Stock item not found',
          itemName: request.itemName
        });
      }

      // Check if there's enough stock
      if (stock.quantity < request.quantity) {
        return res.status(400).json({ 
          message: 'Insufficient stock quantity',
          available: stock.quantity,
          requested: request.quantity
        });
      }

      // Update stock quantity
      stock.quantity -= request.quantity;
      stock.lastUpdated = new Date();
      stock.updatedBy = req.user._id;
      await stock.save();

      console.log('Updated stock:', {
        itemName: stock.itemName,
        newQuantity: stock.quantity,
        deducted: request.quantity
      });

      // Create issuance record
      const issuance = new Issuance({
        item: stock._id,
        quantity: request.quantity,
        unit: request.unit,
        issuedTo: request.requestedBy._id,
        issuedBy: req.user._id,
        purpose: request.purpose,
        remarks: adminRemark || 'Completed by Logistics Officer',
        status: 'completed'  // Set status as completed
      });
      await issuance.save();

      // Update any existing issuance records for this item and user to completed
      await Issuance.updateMany(
        {
          'item': stock._id,
          'issuedTo': request.requestedBy._id,
          'status': 'in-use'
        },
        {
          $set: { status: 'completed' }
        }
      );

      console.log('Created issuance record:', issuance);
    }

    // Update request status
    request.status = status;
    if (adminRemark) {
      request.adminRemark = adminRemark;
    }
    await request.save();

    // Create notification for status change
    const notification = new Notification({
      userId: request.requestedBy._id,
      message: `Your request for ${request.itemName} has been ${status}${adminRemark ? `: ${adminRemark}` : ''}`
    });
    await notification.save();

    // Populate the updated request with requester details
    const updatedRequest = await Request.findById(request._id)
      .populate('requestedBy', 'name email');

    console.log('Request successfully updated:', {
      requestId: updatedRequest._id,
      newStatus: updatedRequest.status,
      updatedBy: req.user.role
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ 
      message: 'Error updating request', 
      error: error.message,
      stack: error.stack 
    });
  }
});

app.get('/api/users', verifyToken, isSystemAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.post('/api/users', verifyToken, isSystemAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username: email, // Use email as username
      name,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();
    const userWithoutPassword = { ...newUser.toObject() };
    delete userWithoutPassword.password;
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
});

app.put('/api/users/:id', verifyToken, isSystemAdmin, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      _id: { $ne: userId },
      email
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        name,
        email,
        username: email, // Keep username synced with email
        role 
      },
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

app.delete('/api/users/:id', verifyToken, isSystemAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent deleting self
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

app.get('/api/stock', verifyToken, checkRole(['LogisticsOfficer', 'Admin', 'UnitLeader']), async (req, res) => {
  try {
    console.log('Fetching stock items for user:', {
      userId: req.user._id,
      userRole: req.user.role
    });
    const stocks = await Stock.find()
      .populate('updatedBy', 'name email')
      .sort({ itemName: 1 });
    res.json(stocks);
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ message: 'Error fetching stock items' });
  }
});

app.post('/api/stock', verifyToken, isLogisticsOfficer, async (req, res) => {
  try {
    console.log('Creating stock item:', {
      user: req.user.role,
      body: req.body
    });

    const { itemName, category, quantity, unit, minQuantity, location, description, expirationDate } = req.body;

    const stock = new Stock({
      itemName,
      category,
      quantity,
      unit,
      minQuantity: minQuantity || 10,
      location,
      description,
      expirationDate,
      updatedBy: req.userId,
      status: 'in-stock'
    });

    await stock.save();
    
    const populatedStock = await Stock.findById(stock._id)
      .populate('updatedBy', 'name email');
    
    res.status(201).json(populatedStock);
  } catch (error) {
    console.error('Error creating stock:', error);
    res.status(500).json({ 
      message: 'Error creating stock item',
      error: error.message 
    });
  }
});

app.put('/api/stock/:id', verifyToken, isLogisticsOfficer, async (req, res) => {
  try {
    console.log('Updating stock item:', {
      user: req.user.role,
      itemId: req.params.id,
      body: req.body
    });

    const { 
      itemName, 
      category, 
      quantity, 
      unit, 
      minQuantity, 
      location, 
      description, 
      expirationDate,
      status 
    } = req.body;
    
    const stockId = req.params.id;

    const updatedStock = await Stock.findByIdAndUpdate(
      stockId,
      {
        itemName,
        category,
        quantity,
        unit,
        minQuantity,
        location,
        description,
        expirationDate,
        status,
        lastUpdated: Date.now(),
        updatedBy: req.userId
      },
      { new: true }
    ).populate('updatedBy', 'name email');

    if (!updatedStock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }

    res.json(updatedStock);
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ 
      message: 'Error updating stock item',
      error: error.message 
    });
  }
});

app.delete('/api/stock/:id', verifyToken, isLogisticsOfficer, async (req, res) => {
  try {
    console.log('Deleting stock item:', {
      user: req.user.role,
      itemId: req.params.id
    });

    const stockId = req.params.id;
    const stock = await Stock.findById(stockId);

    if (!stock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }

    await Stock.findByIdAndDelete(stockId);
    res.json({ message: 'Stock item deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({ 
      message: 'Error deleting stock item',
      error: error.message 
    });
  }
});

app.post('/api/imports/stock', verifyToken, isLogisticsOfficer, async (req, res) => {
  try {
    console.log('📊 Processing Excel import request');
    
    if (!req.files || !req.files.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.file;
    console.log('📁 File received:', file.name);

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      console.log('❌ Invalid file type');
      return res.status(400).json({ message: 'Please upload an Excel file (.xlsx or .xls)' });
    }

    // Read the Excel file
    const workbook = XLSX.read(file.data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📝 Processing ${data.length} rows from Excel`);

    // Validate data structure
    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    // Process each row
    const results = [];
    for (const row of data) {
      try {
        // Log the row being processed
        console.log('Processing row:', row);

        // Map Excel columns to stock fields
        const stockData = {
          itemName: row['Item Name'] || row.itemName,
          category: row['Category'] || row.category,
          quantity: Number(row['Quantity'] || row.quantity),
          unit: row['Unit'] || row.unit,
          minQuantity: Number(row['Minimum Quantity'] || row.minQuantity || 10),
          location: row['Location'] || row.location || 'Default Location',
          description: row['Description'] || row.description || '',
          expirationDate: row['Expiration Date (YYYY-MM-DD)'] || row.expirationDate ? new Date(row['Expiration Date (YYYY-MM-DD)'] || row.expirationDate) : null
        };

        // Validate required fields
        if (!stockData.itemName || !stockData.category || !stockData.quantity || !stockData.unit) {
          console.log('❌ Missing required fields in row:', stockData);
          results.push({ success: false, row: stockData, error: 'Missing required fields' });
          continue;
        }

        // Check if item exists
        const existingItem = await Stock.findOne({ itemName: stockData.itemName });
        
        if (existingItem) {
          // Update existing item
          const updatedItem = await Stock.findByIdAndUpdate(
            existingItem._id,
            {
              category: stockData.category,
              quantity: stockData.quantity,
              unit: stockData.unit,
              minQuantity: stockData.minQuantity,
              location: stockData.location,
              description: stockData.description,
              expirationDate: stockData.expirationDate,
              lastUpdated: Date.now(),
              updatedBy: req.userId
            },
            { new: true }
          ).populate('updatedBy', 'name email');
          
          results.push({ success: true, item: updatedItem, action: 'updated' });
          console.log('✅ Successfully updated:', stockData.itemName);
        } else {
          // Create new item
          const newItem = new Stock({
            ...stockData,
            updatedBy: req.userId,
            status: 'in-stock'
          });

          await newItem.save();
          const populatedItem = await Stock.findById(newItem._id)
            .populate('updatedBy', 'name email');
          
          results.push({ success: true, item: populatedItem, action: 'created' });
          console.log('✅ Successfully created:', stockData.itemName);
        }
      } catch (error) {
        console.error('❌ Error processing row:', error);
        results.push({ success: false, row, error: error.message });
      }
    }

    // Return results summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`📊 Import completed: ${successful} successful, ${failed} failed`);

    res.json({
      message: `Import completed: ${successful} items processed successfully, ${failed} failed`,
      results
    });

  } catch (error) {
    console.error('❌ Excel import error:', error);
    res.status(500).json({ message: 'Error processing Excel file', error: error.message });
  }
});

app.get('/api/categories', verifyToken, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

app.post('/api/categories', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = new Category({ name, description });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Category name already exists' });
    } else {
      res.status(500).json({ message: 'Error creating category' });
    }
  }
});

app.put('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, updatedAt: Date.now() },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Category name already exists' });
    } else {
      res.status(500).json({ message: 'Error updating category' });
    }
  }
});

app.delete('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if category is in use by any stock items
    const stockItems = await Stock.find({ category: req.params.id });
    if (stockItems.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category that is in use by stock items' 
      });
    }
    
    await category.deleteOne();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category' });
  }
});

app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

app.post('/api/notifications', verifyToken, async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ message: 'User ID and message are required' });
    }

    const notification = new Notification({
      userId,
      message
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Error creating notification' });
  }
});

app.put('/api/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

app.get('/api/repair-requests', verifyToken, async (req, res) => {
  try {
    const repairRequests = await RepairRequest.find()
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(repairRequests);
  } catch (error) {
    console.error('Error fetching repair requests:', error);
    res.status(500).json({ message: 'Error fetching repair requests' });
  }
});

app.post('/api/repair-requests', verifyToken, checkRole(['UnitLeader']), upload.single('photo'), async (req, res) => {
  try {
    console.log('Creating repair request:', {
      body: req.body,
      file: req.file,
      user: req.user
    });

    const { location, priority } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Photo is required' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    const repairRequest = new RepairRequest({
      location,
      priority,
      photoUrl,
      requestedBy: req.userId,
      status: 'pending'
    });

    await repairRequest.save();

    // Notify admin about new repair request
    const admins = await User.find({ role: 'Admin' });
    await Promise.all(admins.map(admin => 
      Notification.create({
        userId: admin._id,
        message: `New repair request submitted for location "${location}" by ${req.user.name}`
      })
    ));

    res.status(201).json(repairRequest);
  } catch (error) {
    console.error('Error creating repair request:', error);
    res.status(500).json({ message: 'Error creating repair request', error: error.message });
  }
});

app.get('/api/repair-requests/my-requests', verifyToken, checkRole(['UnitLeader']), async (req, res) => {
  try {
    const requests = await RepairRequest.find({ requestedBy: req.userId })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching repair requests:', error);
    res.status(500).json({ message: 'Error fetching repair requests' });
  }
});

app.patch('/api/repair-requests/:id/status', verifyToken, checkRole(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemark } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be either approved or rejected' });
    }

    const repairRequest = await RepairRequest.findById(id);
    if (!repairRequest) {
      return res.status(404).json({ message: 'Repair request not found' });
    }

    // Update repair request status
    repairRequest.status = status;
    repairRequest.adminRemark = adminRemark;
    repairRequest.updatedAt = new Date();
    await repairRequest.save();

    // If approved, create an under repair item
    if (status === 'approved') {
      const underRepairItem = new UnderRepair({
        repairRequestId: repairRequest._id,
        location: repairRequest.location,
        priority: repairRequest.priority,
        photoUrl: repairRequest.photoUrl,
        requestedBy: repairRequest.requestedBy,
        status: 'pending',
        remarks: adminRemark
      });
      await underRepairItem.save();
    }

    // Notify the requester
    await Notification.create({
      userId: repairRequest.requestedBy,
      message: `Your repair request for location "${repairRequest.location}" has been ${status}${
        adminRemark ? `. Remarks: ${adminRemark}` : ''
      }`
    });

    res.json(repairRequest);
  } catch (error) {
    console.error('Error updating repair request:', error);
    res.status(500).json({ message: 'Error updating repair request' });
  }
});

app.get('/api/under-repair', verifyToken, checkRole(['Admin', 'LogisticsOfficer', 'UnitLeader']), async (req, res) => {
  try {
    const query = req.user.role === 'UnitLeader' ? { requestedBy: req.userId } : {};
    
    const repairItems = await UnderRepair.find(query)
      .sort({ createdAt: -1 })
      .populate('requestedBy', 'name email')
      .populate('repairRequestId');
    
    res.json(repairItems);
  } catch (error) {
    console.error('Error fetching repair items:', error);
    res.status(500).json({ message: 'Error fetching repair items' });
  }
});

app.patch('/api/under-repair/:id/status', verifyToken, checkRole(['Admin', 'LogisticsOfficer']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be either in_progress or completed' });
    }

    const repairItem = await UnderRepair.findById(id);
    if (!repairItem) {
      return res.status(404).json({ message: 'Repair item not found' });
    }

    repairItem.status = status;
    if (remarks) {
      repairItem.remarks = remarks;
    }
    repairItem.updatedAt = new Date();
    await repairItem.save();

    // Notify the requester
    await Notification.create({
      userId: repairItem.requestedBy,
      message: `Your repair item for location "${repairItem.location}" is now ${status === 'in_progress' ? 'being repaired' : 'repaired'}${
        remarks ? `. Remarks: ${remarks}` : ''
      }`
    });

    res.json(repairItem);
  } catch (error) {
    console.error('Error updating repair status:', error);
    res.status(500).json({ message: 'Error updating repair status' });
  }
});

app.post('/api/stock/issue', verifyToken, async (req, res) => {
  try {
    // Verify user is a Logistics Officer (case-insensitive check)
    if (req.user.role.toLowerCase() !== 'logisticsofficer') {
      return res.status(403).json({ 
        message: 'Only Logistics Officers can issue items',
        currentRole: req.user.role
      });
    }

    const { itemName, quantity, unit, issuedTo, purpose, remarks } = req.body;

    // Validate required fields
    if (!itemName || !quantity || !unit || !issuedTo || !purpose) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Convert quantity to number and validate
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }

    // Find the item in stock
    const stockItem = await Stock.findOne({ itemName: itemName }); // Updated to use itemName instead of name
    if (!stockItem) {
      return res.status(404).json({ message: 'Item not found in stock' });
    }

    // Check if sufficient stock is available
    if (stockItem.quantity < numQuantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock',
        available: stockItem.quantity,
        requested: numQuantity
      });
    }

    // Create issuance record
    const issuance = new Issuance({
      item: stockItem._id,
      quantity: numQuantity,
      unit,
      issuedTo,
      issuedBy: req.user._id,
      purpose,
      remarks: remarks || '',
      status: 'in-use'  // Set status as in-use
    });

    // Update stock quantity
    stockItem.quantity -= numQuantity;
    stockItem.lastUpdated = new Date();
    stockItem.updatedBy = req.user._id;
    
    // Check if stock is below minimum quantity
    if (stockItem.quantity <= stockItem.minQuantity) {
      console.log(`Low stock alert: ${itemName} is below minimum quantity`);
      // TODO: Implement notification system for low stock
    }

    // Save both documents
    await Promise.all([
      issuance.save(),
      stockItem.save()
    ]);

    // Populate the issuance record with item and user details
    const populatedIssuance = await Issuance.findById(issuance._id)
      .populate('item', 'itemName category unit')
      .populate('issuedBy', 'name');

    res.status(200).json({
      message: 'Item issued successfully',
      issuance: populatedIssuance
    });

  } catch (error) {
    console.error('Error issuing item:', error);
    res.status(500).json({ message: 'Error issuing item', error: error.message });
  }
});

app.get('/api/reports', verifyToken, checkRole(['Admin', 'SystemAdmin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    // Fetch requests data
    let requests = [];
    try {
      const requestsData = await Request.find({
        createdAt: { $gte: start, $lte: end }
      }).populate('requestedBy', 'name email');
      requests = requestsData || [];
    } catch (err) {
      console.error('Error fetching requests:', err);
    }

    // Fetch stock data
    let stockItems = [];
    try {
      stockItems = await Stock.find();
    } catch (err) {
      console.error('Error fetching stock items:', err);
    }

    // Fetch repair requests data
    let repairs = [];
    try {
      repairs = await RepairRequest.find({
        createdAt: { $gte: start, $lte: end }
      }).populate('requestedBy', 'name email');
    } catch (err) {
      console.error('Error fetching repairs:', err);
    }

    // Get recent activity
    let recentActivity = [];
    try {
      const activities = await Promise.all([
        // Get recent requests
        Request.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('requestedBy', 'name')
          .lean()
          .then(requests => requests.map(req => ({
            date: req.createdAt,
            type: 'Request',
            description: `${req.itemName} (${req.quantity} ${req.unit})`,
            user: req.requestedBy?.name || 'Unknown'
          })))
          .catch(() => []),
        
        // Get recent stock updates
        Stock.find()
          .sort({ lastUpdated: -1 })
          .limit(5)
          .populate('updatedBy', 'name')
          .lean()
          .then(items => items.map(item => ({
            date: item.lastUpdated,
            type: 'Stock Update',
            description: `${item.itemName} - ${item.status}`,
            user: item.updatedBy?.name || 'Unknown'
          })))
          .catch(() => []),

        // Get recent repairs
        RepairRequest.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('requestedBy', 'name')
          .lean()
          .then(repairs => repairs.map(repair => ({
            date: repair.createdAt,
            type: 'Repair',
            description: repair.issue,
            user: repair.requestedBy?.name || 'Unknown'
          })))
          .catch(() => [])
      ]);

      recentActivity = activities
        .flat()
        .sort((a, b) => b.date - a.date)
        .slice(0, 10);
    } catch (err) {
      console.error('Error fetching recent activity:', err);
    }

    // Ensure all arrays are properly initialized
    requests = Array.isArray(requests) ? requests : [];
    repairs = Array.isArray(repairs) ? repairs : [];
    stockItems = Array.isArray(stockItems) ? stockItems : [];

    const response = {
      requestStats: {
        total: requests.length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        pending: requests.filter(r => r.status === 'pending').length
      },
      stockStats: {
        total: stockItems.length,
        lowStock: stockItems.filter(s => s.quantity <= s.minQuantity).length,
        outOfStock: stockItems.filter(s => s.quantity === 0).length
      },
      repairStats: {
        total: repairs.length,
        approved: repairs.filter(r => r.status === 'approved').length,
        rejected: repairs.filter(r => r.status === 'rejected').length,
        pending: repairs.filter(r => r.status === 'pending').length
      },
      recentActivity
    };

    console.log('Reports response:', response); // Debug log
    res.json(response);
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ message: 'Error generating reports', error: error.message });
  }
});

app.get('/api/reports/download/:reportType', verifyToken, checkRole(['Admin', 'SystemAdmin']), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    let data = [];
    let worksheet;
    const workbook = XLSX.utils.book_new();

    switch (reportType) {
      case 'requests':
        data = await Request.find({
          createdAt: { $gte: start, $lte: end }
        }).populate('requestedBy', 'name');

        worksheet = XLSX.utils.json_to_sheet(data.map(r => ({
          'Item': r.itemName,
          'Quantity': r.quantity,
          'Unit': r.unit,
          'Status': r.status,
          'Requester': r.requestedBy?.name || 'Unknown',
          'Purpose': r.purpose,
          'Date': r.createdAt.toLocaleDateString(),
          'Admin Remarks': r.adminRemark || ''
        })));
        break;

      case 'stock':
        data = await Stock.find().populate('updatedBy', 'name');
        worksheet = XLSX.utils.json_to_sheet(data.map(s => ({
          'Item': s.itemName,
          'Category': s.category,
          'Quantity': s.quantity,
          'Unit': s.unit,
          'Min Quantity': s.minQuantity,
          'Location': s.location,
          'Status': s.status,
          'Last Updated': s.lastUpdated.toLocaleDateString(),
          'Updated By': s.updatedBy?.name || 'Unknown'
        })));
        break;

      case 'repairs':
        data = await RepairRequest.find({
          createdAt: { $gte: start, $lte: end }
        }).populate('requestedBy', 'name');

        worksheet = XLSX.utils.json_to_sheet(data.map(r => ({
          'Item': r.itemName,
          'Issue': r.issue,
          'Status': r.status,
          'Requester': r.requestedBy?.name || 'Unknown',
          'Date': r.createdAt.toLocaleDateString(),
          'Admin Remarks': r.adminRemark || ''
        })));
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, reportType.charAt(0).toUpperCase() + reportType.slice(1));
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ message: 'Error downloading report', error: error.message });
  }
});

app.post('/api/stock/bulk-update', verifyToken, isLogisticsOfficer, async (req, res) => {
  try {
    console.log('📊 Processing bulk update request');
    
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items must be an array' });
    }

    console.log(`📝 Processing ${items.length} items`);

    // Process each item
    const results = [];
    for (const item of items) {
      try {
        // Validate required fields
        if (!item.itemName || !item.category || !item.quantity || !item.unit || !item.location) {
          console.log('❌ Missing required fields in item:', item);
          results.push({ success: false, item, error: 'Missing required fields' });
          continue;
        }

        // Check if item exists
        const existingItem = await Stock.findOne({ itemName: item.itemName });
        
        if (existingItem) {
          // Update existing item
          const updatedItem = await Stock.findByIdAndUpdate(
            existingItem._id,
            {
              category: item.category,
              quantity: Number(item.quantity),
              unit: item.unit,
              minQuantity: Number(item.minQuantity) || 10,
              location: item.location,
              description: item.description || '',
              expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
              lastUpdated: Date.now(),
              updatedBy: req.userId
            },
            { new: true }
          ).populate('updatedBy', 'name email');
          
          results.push({ success: true, item: updatedItem, action: 'updated' });
          console.log('✅ Successfully updated:', item.itemName);
        } else {
          // Create new item
          const newItem = new Stock({
            itemName: item.itemName,
            category: item.category,
            quantity: Number(item.quantity),
            unit: item.unit,
            minQuantity: Number(item.minQuantity) || 10,
            location: item.location,
            description: item.description || '',
            expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
            updatedBy: req.userId,
            status: 'in-stock'
          });

          await newItem.save();
          const populatedItem = await Stock.findById(newItem._id)
            .populate('updatedBy', 'name email');
          
          results.push({ success: true, item: populatedItem, action: 'created' });
          console.log('✅ Successfully created:', item.itemName);
        }
      } catch (error) {
        console.error('❌ Error processing item:', error);
        results.push({ success: false, item, error: error.message });
      }
    }

    // Return results summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      message: `Bulk update completed: ${successful} items processed successfully, ${failed} failed`,
      results
    });

  } catch (error) {
    console.error('❌ Bulk update error:', error);
    res.status(500).json({ message: 'Error processing bulk update', error: error.message });
  }
});

app.get('/api/stock/issued', verifyToken, async (req, res) => {
  try {
    console.log('Fetching issued items...');
    const query = req.user.role === 'UnitLeader' ? { status: { $ne: 'completed' } } : {};
    
    const issuedItems = await Issuance.find(query)
      .populate({
        path: 'item',
        select: 'itemName serialNumber status'
      })
      .populate({
        path: 'issuedBy',
        select: 'name'
      })
      .sort({ issuedAt: -1 });

    console.log('Found issued items:', issuedItems.length);

    const formattedItems = await Promise.all(issuedItems.map(async item => {
      let assignedTo = item.issuedTo;
      
      // If issuedTo is an ObjectId, try to fetch the user name
      if (mongoose.Types.ObjectId.isValid(item.issuedTo)) {
        try {
          const user = await User.findById(item.issuedTo);
          if (user) {
            assignedTo = user.name;
          }
        } catch (err) {
          console.error('Error fetching user:', err);
        }
      }

      // Get the request status if it exists
      let status = 'in-use';
      try {
        const request = await Request.findOne({
          itemName: item.item?.itemName,
          requestedBy: mongoose.Types.ObjectId.isValid(item.issuedTo) ? item.issuedTo : null
        }).sort({ updatedAt: -1 });
        
        if (request && request.status === 'completed') {
          status = 'completed';
        }
      } catch (err) {
        console.error('Error fetching request status:', err);
      }

      return {
        _id: item._id,
        name: item.item?.itemName || 'Unknown Item',
        serialNumber: item.item?.serialNumber || 'N/A',
        status,
        assignedTo,
        issueDate: item.issuedAt,
        quantity: item.quantity,
        unit: item.unit,
        purpose: item.purpose,
        remarks: item.remarks
      };
    }));

    res.json(formattedItems);
  } catch (error) {
    console.error('Error fetching issued items:', error);
    res.status(500).json({ message: 'Error fetching issued items' });
  }
});

app.get('/api/logs', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    // Apply filters
    if (req.query.module && req.query.module !== 'All Modules') {
      query.module = req.query.module;
    }
    if (req.query.action && req.query.action !== 'All Actions') {
      query.action = req.query.action;
    }
    if (req.query.startDate && req.query.endDate) {
      query.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    if (req.query.search) {
      query.$or = [
        { details: { $regex: req.query.search, $options: 'i' } },
        { module: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [logs, total] = await Promise.all([
      Log.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'name role')
        .lean(),
      Log.countDocuments(query)
    ]);

    // Transform logs to include user role
    const transformedLogs = logs.map(log => ({
      ...log,
      userRole: log.performedBy?.role || 'Unknown'
    }));

    res.json({
      logs: transformedLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

app.get('/api/logs/export', verifyToken, async (req, res) => {
  try {
    let query = {};

    // Apply filters
    if (req.query.module && req.query.module !== 'All Modules') {
      query.module = req.query.module;
    }
    if (req.query.action && req.query.action !== 'All Actions') {
      query.action = req.query.action;
    }
    if (req.query.startDate && req.query.endDate) {
      query.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .populate('performedBy', 'name role')
      .lean();

    const transformedLogs = logs.map(log => ({
      timestamp: new Date(log.timestamp).toLocaleString(),
      action: log.action,
      module: log.module,
      details: log.details,
      user: log.performedBy?.name || 'System',
      role: log.performedBy?.role || 'Unknown',
      ipAddress: log.ipAddress
    }));

    const fields = ['timestamp', 'action', 'module', 'details', 'user', 'role', 'ipAddress'];
    const csv = json2csv(transformedLogs, { fields });

    res.header('Content-Type', 'text/csv');
    res.attachment(`system-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({ message: 'Error exporting logs' });
  }
});

app.post('/api/test-log', verifyToken, checkRole(['SystemAdmin']), async (req, res) => {
  try {
    const log = new Log({
      action: 'create',
      module: 'test',
      description: 'Test log entry',
      performedBy: req.userId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      metadata: {
        body: { test: true },
        params: {},
        query: {},
        response: 'Test response'
      }
    });

    await log.save();
    console.log('✅ Test log created:', log);
    res.json({ message: 'Test log created', log });
  } catch (error) {
    console.error('❌ Error creating test log:', error);
    res.status(500).json({ message: 'Error creating test log', error: error.message });
  }
});

app.get('/api/debug-logs', verifyToken, checkRole(['SystemAdmin']), async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(10);
    console.log('Debug - Found logs:', logs);
    res.json({ logs });
  } catch (error) {
    console.error('Error in debug logs:', error);
    res.status(500).json({ message: 'Error in debug logs', error: error.message });
  }
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
}); 