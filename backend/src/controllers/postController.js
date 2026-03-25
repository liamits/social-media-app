const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getReceiverSocketId } = require('../socket/socket');
const catchAsync = require('../common/catchAsync');
const ApiError = require('../common/ApiError');
const { sendResponse } = require('../common/response');

const createPost = catchAsync(async (req, res) => {
  const { image, caption, location, tags } = req.body;
  const post = new Post({ user: req.user.id, image, caption, location, tags });
  await post.save();

  // Send notifications to tagged users
  if (tags && tags.length > 0) {
    const io = req.app.get('io');
    for (const tagId of tags) {
      if (tagId.toString() !== req.user.id) {
        const notif = await Notification.create({ recipient: tagId, sender: req.user.id, type: 'tag', post: post._id });
        const socketId = getReceiverSocketId(tagId.toString());
        if (socketId) {
          const populated = await notif.populate('sender', 'username avatar');
          io.to(socketId).emit('newNotification', populated);
        }
      }
    }
  }

  await post.populate([
    { path: 'user', select: 'username avatar fullName' },
    { path: 'tags', select: 'username avatar' }
  ]);
  sendResponse(res, 201, post);
});

const getPosts = catchAsync(async (req, res) => {
  const posts = await Post.find()
    .populate('user', 'username avatar fullName')
    .populate('tags', 'username avatar')
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
      .populate('tags', 'username avatar')
      .populate('comments.user', 'username avatar')
      .populate('comments.tags', 'username avatar')
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
  const { text, tags } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');

  post.comments.push({ user: req.user.id, text, tags });
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

  // Handle tagged users in comments
  if (tags && tags.length > 0) {
    const io = req.app.get('io');
    for (const tagId of tags) {
      if (tagId.toString() !== req.user.id) {
        const notif = await Notification.create({ recipient: tagId, sender: req.user.id, type: 'tag', post: post._id, text: `tagged you in a comment: ${text.substring(0, 30)}...` });
        const socketId = getReceiverSocketId(tagId.toString());
        if (socketId) {
          const populated = await notif.populate('sender', 'username avatar');
          io.to(socketId).emit('newNotification', populated);
        }
      }
    }
  }

  const updated = await Post.findById(req.params.id)
    .populate('user', 'username avatar fullName')
    .populate('tags', 'username avatar')
    .populate('comments.user', 'username avatar')
    .populate('comments.tags', 'username avatar');
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
      { path: 'tags', select: 'username avatar' },
      { path: 'comments.user', select: 'username avatar' },
      { path: 'comments.tags', select: 'username avatar' },
    ],
  });
  if (!user) throw new ApiError(404, 'User not found');
  sendResponse(res, 200, user.savedPosts.reverse());
});

const toggleCommentLike = catchAsync(async (req, res) => {
  const { id: postId, commentId } = req.params;
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found');

  const comment = post.comments.id(commentId);
  if (!comment) throw new ApiError(404, 'Comment not found');

  const isLiked = comment.likes.includes(req.user.id);
  if (isLiked) {
    comment.likes = comment.likes.filter(id => id.toString() !== req.user.id);
  } else {
    comment.likes.push(req.user.id);
    if (comment.user.toString() !== req.user.id) {
      const notif = await Notification.create({
        recipient: comment.user,
        sender: req.user.id,
        type: 'like',
        post: post._id,
        text: `liked your comment: ${comment.text.substring(0, 20)}...`
      });
      const io = req.app.get('io');
      const socketId = getReceiverSocketId(comment.user.toString());
      if (socketId) {
        const populated = await notif.populate('sender', 'username avatar');
        io.to(socketId).emit('newNotification', populated);
      }
    }
  }

  await post.save();
  sendResponse(res, 200, comment.likes);
});

module.exports = { createPost, getPosts, getFeed, likePost, addComment, deletePost, deleteComment, savePost, getSavedPosts, toggleCommentLike };
