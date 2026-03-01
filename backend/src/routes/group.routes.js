const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Group CRUD operations
router.post('/', groupController.createGroup);
router.get('/', groupController.getAllGroups);
router.get('/:id', groupController.getGroup);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

// Member management
router.post('/:id/members', groupController.addMember);
router.delete('/:id/members/:memberId', groupController.removeMember);

// Group expenses summary
router.get('/:id/expenses/summary', groupController.getGroupExpensesSummary);

// Get groups by type
router.get('/type/:type', groupController.getGroupsByType);

// Get recent groups
router.get('/recent/limit/:limit', groupController.getRecentGroups);

module.exports = router;