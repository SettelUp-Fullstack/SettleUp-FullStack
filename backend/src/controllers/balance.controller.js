const Expense = require('../models/expenses.model');
const Group = require('../models/group.model');
const User = require('../models/User');

// Helper function to calculate settlements
function calculateSettlements(balances) {
  if (!balances || balances.length === 0) {
    return [];
  }

  const debtors = balances.filter(b => b && b.amount < 0)
    .map(b => ({ ...b, amount: Math.abs(b.amount) }))
    .sort((a, b) => b.amount - a.amount);
  
  const creditors = balances.filter(b => b && b.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    if (!debtor || !creditor) break;
    
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      settlements.push({
        from: debtor.email,
        fromName: debtor.name || debtor.email,
        fromEmail: debtor.email,
        to: creditor.email,
        toName: creditor.name || creditor.email,
        toEmail: creditor.email,
        amount: Math.round(amount * 100) / 100
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
}

// @desc    Get overall balances for logged in user
// @route   GET /api/balances
// @access  Private
exports.getUserBalances = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const groups = await Group.find({
      $or: [
        { createdBy: userId },
        { 'members.email': userEmail }
      ]
    });

    const groupIds = groups.map(g => g._id);
    const expenses = await Expense.find({
      group: { $in: groupIds }
    }).populate('group');

    const balances = {};
    const userBalance = {
      paid: 0,
      owed: 0
    };

    expenses.forEach(expense => {
      if (!expense.splits) return;
      
      const payerEmail = expense.paidBy;
      
      if (payerEmail === userEmail) {
        userBalance.paid += expense.amount || 0;
      }

      expense.splits.forEach(split => {
        if (!split || !split.member) return;
        
        if (split.member === userEmail) {
          userBalance.owed += split.amount || 0;
        }

        if (!balances[split.member]) {
          let memberName = split.member;
          if (expense.group && expense.group.members) {
            const member = expense.group.members.find(m => m && m.email === split.member);
            memberName = member?.name || split.member;
          }
          
          balances[split.member] = {
            email: split.member,
            name: memberName,
            amount: 0
          };
        }

        if (split.member === payerEmail) {
          balances[split.member].amount += split.amount || 0;
        } else {
          balances[split.member].amount -= split.amount || 0;
        }
      });
    });

    const youAreOwed = userBalance.paid - userBalance.owed;
    const youOwe = userBalance.owed - userBalance.paid;
    
    const summary = {
      youAreOwed: youAreOwed > 0 ? youAreOwed : 0,
      youOwe: youOwe > 0 ? youOwe : 0,
      netBalance: youAreOwed - youOwe
    };

    const individualBalances = Object.values(balances).filter(b => b && b.email !== userEmail);
    const settlements = calculateSettlements(individualBalances);

    res.json({
      success: true,
      summary,
      individualBalances,
      settlements
    });

  } catch (error) {
    console.error('Get balances error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching balances',
      error: error.message
    });
  }
};

// @desc    Get balances for specific group
// @route   GET /api/balances/group/:groupId
// @access  Private
exports.getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userEmail = req.user.email;

    const expenses = await Expense.find({ group: groupId });
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const balances = {};
    if (group.members && group.members.length > 0) {
      group.members.forEach(member => {
        if (member && member.email) {
          balances[member.email] = {
            email: member.email,
            name: member.name || member.email,
            amount: 0
          };
        }
      });
    }

    expenses.forEach(expense => {
      if (!expense.splits) return;
      
      const payerEmail = expense.paidBy;
      
      expense.splits.forEach(split => {
        if (!split || !split.member) return;
        
        if (split.member === payerEmail) {
          if (balances[payerEmail]) {
            balances[payerEmail].amount += split.amount || 0;
          }
        } else {
          if (balances[split.member]) {
            balances[split.member].amount -= split.amount || 0;
          }
        }
      });
    });

    const individualBalances = Object.values(balances).filter(b => b);
    
    const userBalance = balances[userEmail]?.amount || 0;
    const summary = {
      youAreOwed: userBalance > 0 ? userBalance : 0,
      youOwe: userBalance < 0 ? -userBalance : 0,
      netBalance: userBalance
    };

    res.json({
      success: true,
      summary,
      individualBalances
    });

  } catch (error) {
    console.error('Get group balances error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group balances',
      error: error.message
    });
  }
};

// @desc    Get settlements
// @route   GET /api/balances/settlements
// @access  Private
exports.getSettlements = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const groups = await Group.find({
      $or: [
        { createdBy: userId },
        { 'members.email': userEmail }
      ]
    });

    const groupIds = groups.map(g => g._id);
    const expenses = await Expense.find({ group: { $in: groupIds } });

    const balances = {};
    
    expenses.forEach(expense => {
      if (!expense.splits) return;
      
      const payerEmail = expense.paidBy;
      
      expense.splits.forEach(split => {
        if (!split || !split.member) return;
        
        if (!balances[split.member]) {
          balances[split.member] = 0;
        }
        
        if (split.member === payerEmail) {
          balances[split.member] += split.amount || 0;
        } else {
          balances[split.member] -= split.amount || 0;
        }
      });
    });

    const balanceDetails = [];
    
    for (const email in balances) {
      if (email !== userEmail && balances.hasOwnProperty(email)) {
        const amount = balances[email];
        try {
          const user = await User.findOne({ email });
          balanceDetails.push({
            email,
            name: user?.name || email.split('@')[0],
            amount
          });
        } catch (userError) {
          balanceDetails.push({
            email,
            name: email.split('@')[0],
            amount
          });
        }
      }
    }

    const settlements = calculateSettlements(balanceDetails);

    res.json({
      success: true,
      settlements
    });

  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating settlements',
      error: error.message
    });
  }
};