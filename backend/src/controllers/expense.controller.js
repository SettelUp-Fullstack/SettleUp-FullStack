const Expense = require('../models/expenses.model');
const Group = require('../models/group.model');

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res) => {
  try {
    const { description, amount, category, group, paidBy, paidByName, splits, date } = req.body;

    if (!description || !amount || !group || !paidBy) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const groupExists = await Group.findById(group);
    if (!groupExists) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const isMember = groupExists.members.some(
      m => m.email === req.user.email || m._id?.toString() === req.user.id
    );

    if (!isMember && groupExists.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    const expense = await Expense.create({
      description,
      amount,
      category: category || 'Other',
      group,
      paidBy,
      paidByName,
      splits: splits || [],
      createdBy: req.user.id,
      date: date || Date.now()
    });

    await Group.findByIdAndUpdate(group, {
      $inc: { totalExpenses: amount }
    });

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating expense',
      error: error.message
    });
  }
};

// @desc    Get all expenses for logged in user
// @route   GET /api/expenses
// @access  Private
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ createdBy: req.user.id })
      .populate('group', 'name type')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses',
      error: error.message
    });
  }
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('group', 'name type');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this expense'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense',
      error: error.message
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense'
      });
    }

    if (req.body.amount && req.body.amount !== expense.amount) {
      const amountDiff = req.body.amount - expense.amount;
      await Group.findByIdAndUpdate(expense.group, {
        $inc: { totalExpenses: amountDiff }
      });
    }

    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating expense',
      error: error.message
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense'
      });
    }

    await Group.findByIdAndUpdate(expense.group, {
      $inc: { totalExpenses: -expense.amount }
    });

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting expense',
      error: error.message
    });
  }
};

// @desc    Get expenses by group
// @route   GET /api/expenses/group/:groupId
// @access  Private
exports.getExpensesByGroup = async (req, res) => {
  try {
    const expenses = await Expense.find({ 
      group: req.params.groupId,
      createdBy: req.user.id
    }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    console.error('Get expenses by group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses',
      error: error.message
    });
  }
};

// @desc    Get expenses summary
// @route   GET /api/expenses/summary/all
// @access  Private
exports.getExpensesSummary = async (req, res) => {
  try {
    const expenses = await Expense.find({ createdBy: req.user.id });
    
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const byCategory = {};
    
    expenses.forEach(exp => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
    });

    res.status(200).json({
      success: true,
      data: {
        totalExpenses: expenses.length,
        totalAmount,
        byCategory,
        recentExpenses: expenses.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get expenses summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses summary',
      error: error.message
    });
  }
};