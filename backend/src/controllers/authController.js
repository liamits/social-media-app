const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../common/catchAsync');
const ApiError = require('../common/ApiError');
const { sendResponse } = require('../common/response');

const register = catchAsync(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  if (await User.findOne({ email })) throw new ApiError(400, 'Email already in use');
  if (await User.findOne({ username })) throw new ApiError(400, 'Username already taken');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password: hashedPassword, fullName });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  sendResponse(res, 201, { token, user: { id: user._id, username, email, fullName, avatar: user.avatar } });
});

const login = catchAsync(async (req, res) => {
  const { emailOrUsername, password } = req.body;

  const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
  if (!user) throw new ApiError(400, 'Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(400, 'Invalid credentials');

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  sendResponse(res, 200, { token, user: { id: user._id, username: user.username, email: user.email, fullName: user.fullName, avatar: user.avatar } });
});

const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) throw new ApiError(404, 'User not found');
  sendResponse(res, 200, {
    id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    avatar: user.avatar,
    bio: user.bio,
  });
});

module.exports = { register, login, getMe };
