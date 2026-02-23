const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlement.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Settlement CRUD operations
router.post('/', settlementController.createSettlement);
router.get('/', settlementController.getAllSettlements);
router.get('/history/me', settlementController.getMySettlementHistory);
router.get('/stats/summary', settlementController.getSettlementStats);
router.get('/:id', settlementController.getSettlement);
router.put('/:id', settlementController.updateSettlement);
router.patch('/:id/complete', settlementController.completeSettlement);
router.delete('/:id', settlementController.deleteSettlement);

// Get settlements by status
router.get('/status/:status', settlementController.getSettlementsByStatus);

// Get settlements for a specific group
router.get('/group/:groupId', settlementController.getGroupSettlements);

module.exports = router;