const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes = require('./src/routes/auth.routes');
const groupRoutes = require('./src/routes/group.routes');
const expenseRoutes = require('./src/routes/expenses.routes');
const balanceRoutes = require('./src/routes/balances.routes');
const settlementRoutes = require('./src/routes/settlements.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');

const app = express();

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ MongoDB Connected Successfully");
  console.log("Database:", mongoose.connection.name);
})
.catch(err => {
  console.error("❌ MongoDB Connection Error:", err.message);
  process.exit(1);
});

// Debug routes
app.get('/debug/groups', async (req, res) => {
  try {
    const Group = require('./src/models/group.model');
    const groups = await Group.find().populate('createdBy', 'name email');
    res.json({ success: true, count: groups.length, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/debug/users', async (req, res) => {
  try {
    const User = require('./src/models/User');
    const users = await User.find().select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/debug/expenses', async (req, res) => {
  try {
    const Expense = require('./src/models/expenses.model');
    const expenses = await Expense.find()
      .populate('group', 'name type')
      .populate('createdBy', 'name email');
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ROUTES */
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/dashboard', dashboardRoutes);

/* DEBUG ROUTE */
app.get('/debug-save', async (req, res) => {
  try {
    const User = require('./src/models/User');
    const hash = await bcrypt.hash("123", 10);
    const u = await User.create({
      name: "Test",
      email: "t@test.com",
      password: hash
    });
    const token = jwt.sign(
      { id: u._id, email: u.email }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    res.json({ message: "User created successfully", user: u, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* Test route */
app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Server is running",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📍 Auth endpoint: http://localhost:${PORT}/api/auth`);
  console.log(`📍 Groups endpoint: http://localhost:${PORT}/api/groups`);
  console.log(`📍 Expenses endpoint: http://localhost:${PORT}/api/expenses`);
  console.log(`📍 Balances endpoint: http://localhost:${PORT}/api/balances`);
  console.log(`📍 Settlements endpoint: http://localhost:${PORT}/api/settlements`);
  console.log(`📍 Dashboard endpoint: http://localhost:${PORT}/api/dashboard`);
});
