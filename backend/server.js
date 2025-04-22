const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');
const fileUpload = require('express-fileupload');
const userRoutes = require('./routes/users');
const User = require('./models/User');  // Import User model
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  abortOnLimit: true
}));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/logistics', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

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
  itemName: { type: String, required: true },
  issue: { type: String, required: true },
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

const Request = mongoose.model('Request', requestSchema);
const Stock = mongoose.model('Stock', stockSchema);
const Category = mongoose.model('Category', categorySchema);
const Notification = mongoose.model('Notification', notificationSchema);
const RepairRequest = mongoose.model('RepairRequest', repairRequestSchema);
const Issuance = require('./models/Issuance');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    
    // Fetch user data and attach to request
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user is active
    if (user.status === 'inactive') {
      return res.status(403).json({ 
        message: 'Your account has been deactivated. Please contact your system administrator.',
        status: 'inactive',
        isDeactivated: true
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware for role-based access control
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Debug logging
      console.log('Role Check Debug:', {
        userRole: req.user.role,
        allowedRoles,
        endpoint: req.originalUrl,
        method: req.method,
        userId: req.user._id
      });

      // Convert both to same case for comparison
      const userRole = req.user.role.trim();
      const normalizedAllowedRoles = allowedRoles.map(role => role.trim());

      if (!normalizedAllowedRoles.includes(userRole)) {
        console.log('Access Denied:', {
          userRole,
          allowedRoles: normalizedAllowedRoles,
          matches: normalizedAllowedRoles.includes(userRole)
        });
        return res.status(403).json({
          message: `Access denied. This action is only allowed for ${allowedRoles.join(' or ')} roles.`,
          userRole: userRole,
          requiredRoles: allowedRoles
        });
      }
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Error checking permissions', error: error.message });
    }
  };
};

// Role-specific middleware functions
const isAdmin = checkRole(['Admin']);
const isLogisticsOfficer = checkRole(['LogisticsOfficer']);
const isSystemAdmin = checkRole(['SystemAdmin']);
const isUnitLeader = checkRole(['UnitLeader']);

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('Registration attempt:', { name, email, role }); // Debug log

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username: email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if this is the first user (allow them to be SystemAdmin)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;
    const assignedRole = isFirstUser ? 'SystemAdmin' : (role || 'UnitLeader');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username: email, // Use email as username for simplicity
      name,
      email,
      password: hashedPassword,
      role: assignedRole
    });

    await user.save();
    console.log('User created:', { id: user._id, role: user.role }); // Debug log

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active - MUST check before password validation
    if (user.status === 'inactive') {
      return res.status(403).json({ 
        message: 'Your account has been deactivated. Please contact your system administrator.',
        status: 'inactive'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Add this after the auth routes
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

// Request Routes
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
      .populate('requestedBy', 'name email role')
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
      .populate('requestedBy', 'name email role')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ message: 'Error fetching user requests', error: error.message });
  }
});

// Add this after the other request routes
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

// Update request status
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
    } else if (req.user.role === 'Admin') {
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(403).json({ 
          message: 'Admins can only approve or reject requests',
          attemptedStatus: status
        });
      }
    } else {
      return res.status(403).json({ 
        message: 'You do not have permission to update requests',
        userRole: req.user.role
      });
    }

    // Create notification for status change
    const notification = new Notification({
      userId: request.requestedBy._id,
      message: `Your request for ${request.itemName} has been ${status}${adminRemark ? `: ${adminRemark}` : ''}`
    });
    await notification.save();

    // Update request status
    request.status = status;
    if (adminRemark) {
      request.adminRemark = adminRemark;
    }
    
    // If request is being completed, update stock
    if (status === 'completed') {
      const stock = await Stock.findOne({ itemName: request.itemName });
      if (!stock) {
        return res.status(400).json({ error: 'Stock item not found' });
      }

      // Update stock quantity
      stock.quantity -= request.quantity;
      await stock.save();

      // Create issuance record
      const issuance = new Issuance({
        item: stock._id,
        quantity: request.quantity,
        unit: request.unit,
        issuedTo: request.requestedBy._id,
        issuedBy: req.user._id,
        purpose: request.purpose,
        remarks: adminRemark || ''
      });
      await issuance.save();
    }

    await request.save();

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
    res.status(500).json({ message: 'Error updating request', error: error.message });
  }
});

// User Management Routes (Protected for System Admin)
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

// Stock Management Routes - Viewable by Admin and Logistics Officer
app.get('/api/stock', verifyToken, checkRole(['LogisticsOfficer', 'Admin']), async (req, res) => {
  try {
    const stocks = await Stock.find()
      .populate('updatedBy', 'name email')
      .sort({ itemName: 1 });
    res.json(stocks);
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ message: 'Error fetching stock items' });
  }
});

// Add new stock item - Logistics Officer only
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

// Update stock item - Logistics Officer only
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

// Delete stock item - Logistics Officer only
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

// Imports Routes
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
        // Validate required fields
        if (!row.itemName || !row.category || !row.quantity || !row.unit || !row.location) {
          console.log('❌ Missing required fields in row:', row);
          results.push({ success: false, row, error: 'Missing required fields' });
          continue;
        }

        // Create new stock item
        const stock = new Stock({
          itemName: row.itemName,
          category: row.category,
          quantity: Number(row.quantity),
          unit: row.unit,
          minQuantity: Number(row.minQuantity) || 10,
          location: row.location,
          description: row.description || '',
          expirationDate: row.expirationDate ? new Date(row.expirationDate) : null,
          updatedBy: req.userId
        });

        await stock.save();
        results.push({ success: true, itemName: row.itemName });
        console.log('✅ Successfully imported:', row.itemName);
      } catch (error) {
        console.error('❌ Error processing row:', error);
        results.push({ success: false, row, error: error.message });
      }
    }

    // Return results summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      message: `Import completed: ${successful} items imported successfully, ${failed} failed`,
      results
    });

  } catch (error) {
    console.error('❌ Excel import error:', error);
    res.status(500).json({ message: 'Error processing Excel file', error: error.message });
  }
});

// Category Routes
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

// Notification Routes
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

// Repair Request Routes
app.get('/api/repair-requests', verifyToken, checkRole(['Admin', 'LogisticsOfficer']), async (req, res) => {
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

app.post('/api/repair-requests', verifyToken, async (req, res) => {
  try {
    const { itemName, issue } = req.body;
    
    const repairRequest = new RepairRequest({
      itemName,
      issue,
      requestedBy: req.userId,
      status: 'pending'
    });

    await repairRequest.save();
    
    const populatedRequest = await RepairRequest.findById(repairRequest._id)
      .populate('requestedBy', 'name email');
    
    // Create notification for admin
    const admins = await User.find({ role: 'Admin' });
    for (const admin of admins) {
      await new Notification({
        userId: admin._id,
        message: `New repair request for ${itemName} by ${req.user.name}`
      }).save();
    }

    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error('Error creating repair request:', error);
    res.status(500).json({ message: 'Error creating repair request' });
  }
});

app.put('/api/repair-requests/:id', verifyToken, checkRole(['Admin']), async (req, res) => {
  try {
    const { status, adminRemark } = req.body;
    
    const repairRequest = await RepairRequest.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminRemark,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('requestedBy', 'name email');

    if (!repairRequest) {
      return res.status(404).json({ message: 'Repair request not found' });
    }

    // Create notification for requester
    await new Notification({
      userId: repairRequest.requestedBy._id,
      message: `Your repair request for ${repairRequest.itemName} has been ${status}`
    }).save();

    res.json(repairRequest);
  } catch (error) {
    console.error('Error updating repair request:', error);
    res.status(500).json({ message: 'Error updating repair request' });
  }
});

app.delete('/api/repair-requests/:id', verifyToken, checkRole(['Admin']), async (req, res) => {
  try {
    const repairRequest = await RepairRequest.findById(req.params.id);
    
    if (!repairRequest) {
      return res.status(404).json({ message: 'Repair request not found' });
    }

    await RepairRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Repair request deleted successfully' });
  } catch (error) {
    console.error('Error deleting repair request:', error);
    res.status(500).json({ message: 'Error deleting repair request' });
  }
});

// Route for Logistics Officers to issue items directly
app.post('/api/stock/issue', verifyToken, async (req, res) => {
  try {
    // Verify user is a Logistics Officer
    if (req.user.role !== 'Logistics Officer') {
      return res.status(403).json({ message: 'Only Logistics Officers can issue items' });
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
    const stockItem = await Stock.findOne({ name: itemName });
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
      remarks: remarks || ''
    });

    // Update stock quantity
    stockItem.quantity -= numQuantity;
    
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
      .populate('item', 'name category unit')
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

// Reports Routes
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

// Download reports endpoint
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

app.use('/api/users', userRoutes);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 