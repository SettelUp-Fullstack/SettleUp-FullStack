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

/* ============================================
   CORS CONFIGURATION
   ============================================ */
const allowedOrigins = [
  'http://localhost:4200',
  'https://settleup-omega.vercel.app',
  'https://settelup-6str11yfe-gauravi.vercel.app', // Add your Vercel preview URLs if needed
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(null, true); // Allow for now, change to false in strict production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Handle preflight requests
app.options('*', cors());

/* ============================================
   MIDDLEWARE
   ============================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* ============================================
   MONGODB CONNECTION
   ============================================ */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 6+ no longer needs useNewUrlParser and useUnifiedTopology
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('Full error:', err);
    // Don't exit immediately, let Render restart the service
    setTimeout(() => process.exit(1), 1000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// Connect to database
connectDB();

/* ============================================
   HEALTH CHECK ROUTES
   ============================================ */
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SettleUp Backend Running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.status(200).json(healthCheck);
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Server is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

/* ============================================
   API ROUTES
   ============================================ */
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/dashboard', dashboardRoutes);

/* ============================================
   ERROR HANDLING MIDDLEWARE
   ============================================ */
// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

/* ============================================
   SERVER STARTUP
   ============================================ */
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Required for Render

const server = app.listen(PORT, HOST, () => {
  console.log('='.repeat(50));
  console.log('🚀 SettleUp Backend Server Started');
  console.log('='.repeat(50));
  console.log(`📡 Server: http://${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(50));
});

/* ============================================
   PROCESS ERROR HANDLERS
   ============================================ */
// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server Error:', error);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else if (error.code === 'EACCES') {
    console.error(`❌ Port ${PORT} requires elevated privileges`);
    process.exit(1);
  } else {
    console.error('❌ Unknown server error:', error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('❌ Reason:', reason);
  // Close server & exit process
  server.close(() => {
    console.log('💀 Server closed due to unhandled rejection');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Close server & exit process
  server.close(() => {
    console.log('💀 Server closed due to uncaught exception');
    process.exit(1);
  });
});

// Handle SIGTERM (Render uses this to shut down services)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Server closed');
    mongoose.connection.close(false, () => {
      console.log('💤 MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Server closed');
    mongoose.connection.close(false, () => {
      console.log('💤 MongoDB connection closed');
      process.exit(0);
    });
  });
});

/* ============================================
   EXPORT APP (for testing)
   ============================================ */
module.exports = app;
