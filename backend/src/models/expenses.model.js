const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    enum: ['Food', 'Travel', 'Shopping', 'Entertainment', 'Bills', 'Other'],
    default: 'Other'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  paidBy: {
    type: String,
    required: true
  },
  paidByName: {
    type: String
  },
  splits: [{
    member: String,
    amount: Number,
    paid: {
      type: Boolean,
      default: false
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
expenseSchema.index({ group: 1, createdAt: -1 });
expenseSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Expense', expenseSchema);