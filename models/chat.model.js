const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false, // Default to unread
    },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    messages: [messageSchema],
    lastMessage: {
      type: String,
    },
    lastMessageTimestamp: {
      type: Date,
    },
  },
  { timestamps: true }
);
chatSchema.index({ admin: 1, partner: 1 });
chatSchema.index({ "messages.read": 1 });
module.exports = mongoose.model('Chat', chatSchema);
