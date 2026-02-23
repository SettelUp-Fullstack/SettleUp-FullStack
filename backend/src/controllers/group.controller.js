const Group = require('../models/group.model');
const User = require('../models/User');
const Expense = require('../models/expenses.model');

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
  try {
    const { name, type, members } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide group name and type'
      });
    }

    if (!members || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please add at least one member'
      });
    }

    const creator = await User.findById(req.user.id);
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const groupMembers = [
      {
        user: req.user.id,
        name: creator.name,
        email: creator.email,
        joinedAt: new Date()
      },
      ...members.map(member => ({
        name: member.name,
        email: member.email.toLowerCase()
      }))
    ];

    const group = await Group.create({
      name,
      type,
      createdBy: req.user.id,
      members: groupMembers
    });

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating group',
      error: error.message
    });
  }
};

// @desc    Get all groups for logged in user
// @route   GET /api/groups
// @access  Private
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { createdBy: req.user.id },
        { 'members.email': req.user.email }
      ]
    })
    .populate('createdBy', 'name email')
    .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching groups',
      error: error.message
    });
  }
};

// @desc    Get single group by ID
// @route   GET /api/groups/:id
// @access  Private
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const isMember = group.members.some(
      member => member.email === req.user.email
    );

    if (!isMember && group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group',
      error: error.message
    });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private
exports.updateGroup = async (req, res) => {
  try {
    const { name, type } = req.body;
    
    let group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can update group'
      });
    }

    group = await Group.findByIdAndUpdate(
      req.params.id,
      { name, type, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating group',
      error: error.message
    });
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID format'
      });
    }

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can delete group'
      });
    }

    await group.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting group',
      error: error.message
    });
  }
};

// @desc    Add member to group
// @route   POST /api/groups/:id/members
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and email'
      });
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can add members'
      });
    }

    const memberExists = group.members.some(
      member => member.email === email.toLowerCase()
    );

    if (memberExists) {
      return res.status(400).json({
        success: false,
        message: 'Member already exists in group'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    group.members.push({
      user: existingUser ? existingUser._id : null,
      name,
      email: email.toLowerCase()
    });

    await group.save();

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: error.message
    });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:memberId
// @access  Private
exports.removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only group creator can remove members'
      });
    }

    const memberToRemove = group.members.id(req.params.memberId);
    if (memberToRemove && memberToRemove.email === req.user.email) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group creator'
      });
    }

    group.members.pull(req.params.memberId);
    await group.save();

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: error.message
    });
  }
};

// @desc    Get group expenses summary
// @route   GET /api/groups/:id/expenses/summary
// @access  Private
exports.getGroupExpensesSummary = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const memberBalances = {};
    group.members.forEach(member => {
      memberBalances[member.email] = {
        name: member.name,
        balance: 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        groupName: group.name,
        totalExpenses: group.totalExpenses || 0,
        totalMembers: group.members.length,
        memberBalances
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

// @desc    Get groups by type
// @route   GET /api/groups/type/:type
// @access  Private
exports.getGroupsByType = async (req, res) => {
  try {
    const groups = await Group.find({
      'members.email': req.user.email,
      type: req.params.type
    })
    .populate('createdBy', 'name email')
    .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    console.error('Get groups by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching groups',
      error: error.message
    });
  }
};

// @desc    Get recent groups
// @route   GET /api/groups/recent/limit/:limit
// @access  Private
exports.getRecentGroups = async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 5;

    const groups = await Group.find({
      'members.email': req.user.email
    })
    .populate('createdBy', 'name email')
    .sort('-createdAt')
    .limit(limit);

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    console.error('Get recent groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent groups',
      error: error.message
    });
  }
};