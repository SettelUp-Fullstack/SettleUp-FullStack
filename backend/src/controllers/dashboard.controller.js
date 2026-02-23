const Group = require('../models/group.model');
const Expense = require('../models/expenses.model');
const Settlement = require('../models/settlement.model');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log('Dashboard stats requested for user:', userEmail);

    // 1. Get total groups count where user is member or creator
    const totalGroups = await Group.countDocuments({
      $or: [
        { createdBy: userId },
        { 'members.email': userEmail }
      ]
    });

    // 2. Get all expenses involving user
    const expenses = await Expense.find({
      $or: [
        { createdBy: userId },
        { paidBy: userEmail },
        { 'splits.member': userEmail }
      ]
    }).populate('group', 'name');

    // 3. Calculate total expenses
    const totalExpensesAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalTransactions = expenses.length;

    // 4. Calculate user's balance
    let youAreOwed = 0;
    let youOwe = 0;

    expenses.forEach(expense => {
      const payerEmail = expense.paidBy;
      
      // If user paid, others owe them
      if (payerEmail === userEmail) {
        youAreOwed += expense.amount;
      }

      // Check splits to see what user owes to others
      if (expense.splits && expense.splits.length > 0) {
        expense.splits.forEach(split => {
          if (split.member === userEmail && payerEmail !== userEmail) {
            youOwe += split.amount || 0;
          }
        });
      }
    });

    const netBalance = youAreOwed - youOwe;

    // 5. Get unsettled count (pending settlements involving user)
    const unsettledCount = await Settlement.countDocuments({
      $or: [
        { from: userEmail },
        { to: userEmail }
      ],
      status: 'pending'
    });

    // 6. Get recent groups (last 5)
    const recentGroups = await Group.find({
      $or: [
        { createdBy: userId },
        { 'members.email': userEmail }
      ]
    })
    .select('name type createdAt members')
    .sort('-createdAt')
    .limit(5);

    // 7. Get recent expenses (last 5)
    const recentExpenses = await Expense.find({
      $or: [
        { createdBy: userId },
        { paidBy: userEmail },
        { 'splits.member': userEmail }
      ]
    })
    .populate('group', 'name')
    .sort('-createdAt')
    .limit(5);

    // Format recent expenses for display
    const formattedExpenses = recentExpenses.map(expense => ({
      _id: expense._id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category || 'Other',
      date: expense.date || expense.createdAt,
      groupName: expense.group?.name || 'Unknown Group',
      paidBy: expense.paidBy,
      splitCount: expense.splits?.length || 0
    }));

    // 8. Get pending settlements count
    const pendingSettlements = await Settlement.countDocuments({
      $or: [
        { from: userEmail },
        { to: userEmail }
      ],
      status: 'pending'
    });

    // 9. Get completed settlements count
    const completedSettlements = await Settlement.countDocuments({
      $or: [
        { from: userEmail },
        { to: userEmail }
      ],
      status: 'completed'
    });

    // Send response
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalGroups,
          totalExpenses: {
            amount: totalExpensesAmount,
            count: totalTransactions
          },
          yourBalance: {
            youAreOwed,
            youOwe,
            netBalance
          },
          unsettled: unsettledCount,
          pendingSettlements,
          completedSettlements
        },
        recentGroups,
        recentExpenses: formattedExpenses
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};