const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;