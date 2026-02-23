const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balance.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get overall balances for user
router.get('/', balanceController.getUserBalances);

// Get balances for specific group
router.get('/group/:groupId', balanceController.getGroupBalances);

// Get settlements
router.get('/settlements', balanceController.getSettlements);

module.exports = router;