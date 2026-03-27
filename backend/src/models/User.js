const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String },
  avatar: { type: String, default: 'https://res.cloudinary.com/djx14arnq/image/upload/v1774602464/social-app/default_avatar.jpg' },
  bio: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  status: { type: String, enum: ['active', 'locked'], default: 'active' },
  lockUntil: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
