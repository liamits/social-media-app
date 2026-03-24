const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const catchAsync = require('../common/utils/catchAsync');
const ApiError = require('../common/utils/ApiError');
const { sendResponse } = require('../common/utils/response');

const getUserProfile = catchAsync(async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).select('-password');
  if (!user) throw new ApiError(404, 'User not found');

  const posts = await Post.find({ user: user._id }).sort({ createdAt: -1 });
  sendResponse(res, 200, {
    user,
    posts,
    postCount: posts.length,
    followersCount: user.followers.length,
    followingCount: user.following.length,
  });
});

const followUnfollowUser = catchAsync(async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user.id;

  if (targetUserId === currentUserId) throw new ApiError(400, 'You cannot follow yourself');

  const [targetUser, currentUser] = await Promise.all([
    User.findById(targetUserId),
    User.findById(currentUserId),
  ]);
  if (!targetUser || !currentUser) throw new ApiError(404, 'User not found');

  const isFollowing = currentUser.following.includes(targetUserId);
  if (isFollowing) {
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
  } else {
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);
    await Notification.create({ recipient: targetUserId, sender: currentUserId, type: 'follow' });
  }

  await Promise.all([currentUser.save(), targetUser.save()]);
  sendResponse(res, 200, null, isFollowing ? 'Unfollowed successfully' : 'Followed successfully');
});

const searchUsers = catchAsync(async (req, res) => {
  const { q } = req.query;
  if (!q) return sendResponse(res, 200, []);

  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { fullName: { $regex: q, $options: 'i' } },
    ],
  }).select('username fullName avatar').limit(10);

  sendResponse(res, 200, users);
});

const updateProfile = catchAsync(async (req, res) => {
  const { fullName, bio, avatar } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (fullName !== undefined) user.fullName = fullName;
  if (bio !== undefined) user.bio = bio;
  if (avatar) user.avatar = avatar;
  await user.save();

  sendResponse(res, 200, {
    id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    bio: user.bio,
    avatar: user.avatar,
  }, 'Profile updated successfully');
});

const getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select('username avatar fullName');
  if (!user) throw new ApiError(404, 'User not found');
  sendResponse(res, 200, { user });
});

const getSuggestions = catchAsync(async (req, res) => {
  const currentUser = await User.findById(req.user.id).select('following');
  const excludeIds = [...currentUser.following, req.user.id];
  const users = await User.find({ _id: { $nin: excludeIds } })
    .select('username fullName avatar')
    .limit(5);
  sendResponse(res, 200, users);
});

const getFollowers = catchAsync(async (req, res) => {
  if (req.params.id !== req.user.id) throw new ApiError(403, 'Unauthorized');
  const user = await User.findById(req.params.id).populate('followers', 'username avatar fullName');
  if (!user) throw new ApiError(404, 'User not found');
  sendResponse(res, 200, user.followers);
});

const getFollowing = catchAsync(async (req, res) => {
  if (req.params.id !== req.user.id) throw new ApiError(403, 'Unauthorized');
  const user = await User.findById(req.params.id).populate('following', 'username avatar fullName');
  if (!user) throw new ApiError(404, 'User not found');
  sendResponse(res, 200, user.following);
});

module.exports = { getUserProfile, followUnfollowUser, searchUsers, updateProfile, getUserById, getSuggestions, getFollowers, getFollowing };
