const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getReceiverSocketId } = require('../socket/socket');
const catchAsync = require('../common/utils/catchAsync');
const ApiError = require('../common/utils/ApiError');
const { sendResponse } = require('../common/utils/response');

const createPost = catchAsync(async (req, res) => {
  const { image, caption, location } = req.body;
  const post = new Post({ user: req.user.id, image, caption, location });
  await post.save();
  await post.populate('user', 'username avatar fullName');
  sendResponse(res, 201, post);
});

const getPosts = catchAsync(async (req, res) => {
  const posts = await Post.find()
    .populate('user', 'username avatar fullName')
    .sort({ createdAt: -1 });
  sendResponse(res, 200, posts);
});

const getFeed = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const followingIds = [...user.following, user._id];
  const query = user.following.length > 0 ? { user: { $in: followingIds } } : {};

  const [posts, total] = await Promise.all([
    Post.find(query)
      .populate('user', 'username avatar fullName')
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments(query),
  ]);

  sendResponse(res, 200, posts, undefined, {
    page,
    limit,
    total,
    hasMore: skip + posts.length < total,
  });
});

const likePost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');

  const isLiked = post.likes.includes(req.user.id);
  if (isLiked) {
    post.likes = post.likes.filter(id => id.toString() !== req.user.id);
  } else {
    post.likes.push(req.user.id);
    if (post.user.toString() !== req.user.id) {
      const notif = await Notification.create({ recipient: post.user, sender: req.user.id, type: 'like', post: post._id });
      const io = req.app.get('io');
      const socketId = getReceiverSocketId(post.user.toString());
      if (socketId) {
        const populated = await notif.populate('sender', 'username avatar');
        io.to(socketId).emit('newNotification', populated);
      }
    }
  }
  await post.save();
  sendResponse(res, 200, post);
});

const addComment = catchAsync(async (req, res) => {
  const { text } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');

  post.comments.push({ user: req.user.id, text });
  await post.save();

  if (post.user.toString() !== req.user.id) {
    const notif = await Notification.create({ recipient: post.user, sender: req.user.id, type: 'comment', post: post._id, text: text.substring(0, 50) });
    const io = req.app.get('io');
    const socketId = getReceiverSocketId(post.user.toString());
    if (socketId) {
      const populated = await notif.populate('sender', 'username avatar');
      io.to(socketId).emit('newNotification', populated);
    }
  }

  const updated = await Post.findById(req.params.id)
    .populate('user', 'username avatar fullName')
    .populate('comments.user', 'username avatar');
  sendResponse(res, 200, updated);
});

const deletePost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');
  if (post.user.toString() !== req.user.id) throw new ApiError(403, 'Unauthorized');
  await post.deleteOne();
  sendResponse(res, 200, null, 'Post deleted');
});

const deleteComment = catchAsync(async (req, res) => {
  const { id: postId, commentId } = req.params;
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found');

  const comment = post.comments.id(commentId);
  if (!comment) throw new ApiError(404, 'Comment not found');
  if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id)
    throw new ApiError(403, 'Unauthorized');

  post.comments.pull(commentId);
  await post.save();
  sendResponse(res, 200, null, 'Comment deleted');
});

const savePost = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  const postId = req.params.id;
  const isSaved = user.savedPosts.some(id => id.toString() === postId);

  if (isSaved) {
    user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
  } else {
    user.savedPosts.push(postId);
  }
  await user.save();
  sendResponse(res, 200, { saved: !isSaved });
});

const getSavedPosts = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: 'savedPosts',
    populate: [
      { path: 'user', select: 'username avatar fullName' },
      { path: 'comments.user', select: 'username avatar' },
    ],
  });
  if (!user) throw new ApiError(404, 'User not found');
  sendResponse(res, 200, user.savedPosts.reverse());
});

module.exports = { createPost, getPosts, getFeed, likePost, addComment, deletePost, deleteComment, savePost, getSavedPosts };
