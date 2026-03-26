const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: function() { return this.type === 'text'; }
  },
  type: {
    type: String,
    enum: ['text', 'post'],
    default: 'text'
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
