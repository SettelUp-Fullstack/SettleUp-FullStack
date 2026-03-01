const Settlement = require('../models/settlement.model');
const Group = require('../models/group.model');
const Expense = require('../models/expenses.model');

// @desc    Create a new settlement
// @route   POST /api/settlements
// @access  Private
exports.createSettlement = async (req, res) => {
  try {
    const { from, fromName, to, toName, amount, group, groupName, notes, relatedExpenses } = req.body;

    if (!from || !to || !amount || !group) {
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

    const settlement = await Settlement.create({
      from,
      fromName,
      to,
      toName,
      amount,
      group,
      groupName: groupName || groupExists.name,
      notes,
      relatedExpenses,
      settledBy: req.user.id,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: settlement
    });
  } catch (error) {
    console.error('Create settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating settlement',
      error: error.message
    });
  }
};

// @desc    Get all settlements for logged in user
// @route   GET /api/settlements
// @access  Private
exports.getAllSettlements = async (req, res) => {
  try {
    const settlements = await Settlement.find({
      $or: [
        { from: req.user.email },
        { to: req.user.email },
        { settledBy: req.user.id }
      ]
    })
    .populate('group', 'name type')
    .populate('settledBy', 'name email')
    .sort('-settledAt');

    res.status(200).json({
      success: true,
      count: settlements.length,
      data: settlements
    });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settlements',
      error: error.message
    });
  }
};

// @desc    Get settlement history for logged in user
// @route   GET /api/settlements/history/me
// @access  Private
exports.getMySettlementHistory = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const settlements = await Settlement.find({
      $or: [
        { from: userEmail },
        { to: userEmail }
      ]
    })
    .populate('group', 'name type')
    .sort('-settledAt')
    .limit(50);

    const history = settlements.map(settlement => {
      const isPayer = settlement.from === userEmail;
      return {
        id: settlement._id,
        date: settlement.settledAt,
        completedAt: settlement.completedAt,
        amount: settlement.amount,
        type: isPayer ? 'paid' : 'received',
        counterparty: isPayer ? settlement.toName : settlement.fromName,
        counterpartyEmail: isPayer ? settlement.to : settlement.from,
        group: settlement.group,
        groupName: settlement.groupName,
        status: settlement.status,
        paymentMethod: settlement.paymentMethod,
        notes: settlement.notes
      };
    });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Get settlement history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settlement history',
      error: error.message
    });
  }
};

// @desc    Get settlement statistics
// @route   GET /api/settlements/stats/summary
// @access  Private
exports.getSettlementStats = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const settlements = await Settlement.find({
      $or: [
        { from: userEmail },
        { to: userEmail }
      ]
    });

    const stats = {
      totalSettlements: settlements.length,
      pendingAmount: 0,
      completedAmount: 0,
      receivedAmount: 0,
      paidAmount: 0,
      pendingCount: 0,
      completedCount: 0,
      netSettled: 0
    };

    settlements.forEach(settlement => {
      if (settlement.status === 'pending') {
        stats.pendingCount++;
        if (settlement.to === userEmail) {
          stats.pendingAmount += settlement.amount;
        } else {
          stats.pendingAmount -= settlement.amount;
        }
      } else if (settlement.status === 'completed') {
        stats.completedCount++;
        if (settlement.to === userEmail) {
          stats.receivedAmount += settlement.amount;
          stats.completedAmount += settlement.amount;
        } else {
          stats.paidAmount += settlement.amount;
          stats.completedAmount -= settlement.amount;
        }
      }
    });

    stats.netSettled = stats.receivedAmount - stats.paidAmount;

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get settlement stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settlement stats',
      error: error.message
    });
  }
};

// @desc    Get single settlement by ID
// @route   GET /api/settlements/:id
// @access  Private
exports.getSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id)
      .populate('group', 'name type')
      .populate('settledBy', 'name email');

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: settlement
    });
  } catch (error) {
    console.error('Get settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settlement',
      error: error.message
    });
  }
};

// @desc    Update settlement
// @route   PUT /api/settlements/:id
// @access  Private
exports.updateSettlement = async (req, res) => {
  try {
    let settlement = await Settlement.findById(req.params.id);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    if (settlement.settledBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this settlement'
      });
    }

    if (settlement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled settlement'
      });
    }

    settlement = await Settlement.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: settlement
    });
  } catch (error) {
    console.error('Update settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settlement',
      error: error.message
    });
  }
};

// @desc    Mark settlement as completed
// @route   PATCH /api/settlements/:id/complete
// @access  Private
exports.completeSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    const isInvolved = settlement.from === req.user.email || 
                       settlement.to === req.user.email;

    if (!isInvolved) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this settlement'
      });
    }

    if (settlement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Settlement is already completed or cancelled'
      });
    }

    settlement.status = 'completed';
    settlement.completedAt = Date.now();
    await settlement.save();

    res.status(200).json({
      success: true,
      data: settlement
    });
  } catch (error) {
    console.error('Complete settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing settlement',
      error: error.message
    });
  }
};

// @desc    Delete settlement
// @route   DELETE /api/settlements/:id
// @access  Private
exports.deleteSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    if (settlement.settledBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this settlement'
      });
    }

    if (settlement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed or cancelled settlement'
      });
    }

    await settlement.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Settlement deleted successfully'
    });
  } catch (error) {
    console.error('Delete settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting settlement',
      error: error.message
    });
  }
};

// @desc    Get settlements by status
// @route   GET /api/settlements/status/:status
// @access  Private
exports.getSettlementsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const settlements = await Settlement.find({
      $or: [
        { from: req.user.email },
        { to: req.user.email }
      ],
      status
    })
    .populate('group', 'name type')
    .sort('-settledAt');

    res.status(200).json({
      success: true,
      count: settlements.length,
      data: settlements
    });
  } catch (error) {
    console.error('Get settlements by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settlements',
      error: error.message
    });
  }
};

// @desc    Get settlements for a specific group
// @route   GET /api/settlements/group/:groupId
// @access  Private
exports.getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;

    const settlements = await Settlement.find({
      group: groupId
    })
    .populate('settledBy', 'name email')
    .sort('-settledAt');

    res.status(200).json({
      success: true,
      count: settlements.length,
      data: settlements
    });
  } catch (error) {
    console.error('Get group settlements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group settlements',
      error: error.message
    });
  }
};