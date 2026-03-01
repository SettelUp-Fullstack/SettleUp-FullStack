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
/* ✅ IMPROVED ERROR HANDLING */
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server Error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Handle process errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
/* ✅ FIX 1: PRODUCTION CORS */
const allowedOrigins = [
  'http://localhost:4200',
  'https://settleup-omega.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // allow for testing
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ✅ FIX 2: MONGODB CONNECT */
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("✅ MongoDB Connected Successfully");
  console.log("Database:", mongoose.connection.name);
})
.catch(err => {
  console.error("❌ MongoDB Connection Error:", err);
  process.exit(1);
});

/* ✅ ROOT ROUTE FOR RENDER HEALTH CHECK */
app.get('/', (req, res) => {
  res.send("SettleUp Backend Running");
});

/* ROUTES */
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/dashboard', dashboardRoutes);

/* TEST ROUTE */
app.get('/api/test', (req, res) => {
  res.json({
    message: "Server is running",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

/* ✅ FIX 3: REQUIRED FOR RENDER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
