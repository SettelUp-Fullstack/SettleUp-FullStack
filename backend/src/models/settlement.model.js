const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  from: {
    type: String,
    required: [true, 'Payer email is required'],
    lowercase: true
  },
  fromName: {
    type: String,
    required: [true, 'Payer name is required']
  },
  to: {
    type: String,
    required: [true, 'Receiver email is required'],
    lowercase: true
  },
  toName: {
    type: String,
    required: [true, 'Receiver name is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  groupName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank transfer', 'other'],
    default: 'cash'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  settledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  relatedExpenses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
settlementSchema.index({ from: 1, status: 1 });
settlementSchema.index({ to: 1, status: 1 });
settlementSchema.index({ group: 1, settledAt: -1 });
settlementSchema.index({ settledBy: 1, settledAt: -1 });

module.exports = mongoose.model('Settlement', settlementSchema);