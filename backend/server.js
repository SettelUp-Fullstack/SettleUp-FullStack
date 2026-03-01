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
