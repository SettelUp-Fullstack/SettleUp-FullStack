const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Expense CRUD operations
router.post('/', expenseController.createExpense);
router.get('/', expenseController.getAllExpenses);
router.get('/:id', expenseController.getExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

// Get expenses by group
router.get('/group/:groupId', expenseController.getExpensesByGroup);

// Get expenses summary
router.get('/summary/all', expenseController.getExpensesSummary);

module.exports = router;