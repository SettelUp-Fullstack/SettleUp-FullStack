const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Group type is required'],
    enum: ['Trip', 'Home', 'Office', 'Other'],
    default: 'Other'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalExpenses: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
groupSchema.index({ createdBy: 1, createdAt: -1 });
groupSchema.index({ 'members.email': 1 });

module.exports = mongoose.model('Group', groupSchema);