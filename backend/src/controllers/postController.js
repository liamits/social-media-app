const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getReceiverSocketId } = require('../socket/socket');
const catchAsync = require('../common/catchAsync');
const ApiError = require('../common/ApiError');
const { sendResponse } = require('../common/response');

const createPost = catchAsync(async (req, res) => {
  const { caption, location, tags, images } = req.body;
  let { image } = req.body;

  if (images && images.length > 0) {
    image = images[0];
  } else if (image) {
    req.body.images = [image];
  }

  const post = await Post.create({
    user: req.user.id,
    image,
    images: req.body.images || [image],
    caption,
    location,
    tags
  });

  // Notifications for tagged users
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

  const populated = await Post.findById(post._id)
    .populate('user', 'username avatar fullName')
    .populate('tags', 'username avatar');
  sendResponse(res, 201, populated);
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
  const { text, tags, parentId } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');

  const newComment = { user: req.user.id, text, tags, parentId };
  post.comments.push(newComment);
  await post.save();

  // Notifications
  if (post.user.toString() !== req.user.id) {
    const notif = await Notification.create({ recipient: post.user, sender: req.user.id, type: 'comment', post: post._id, text: text.substring(0, 50) });
    const io = req.app.get('io');
    const socketId = getReceiverSocketId(post.user.toString());
    if (socketId) {
      const populated = await notif.populate('sender', 'username avatar');
      io.to(socketId).emit('newNotification', populated);
    }
  }

  if (parentId) {
    const parentComment = post.comments.id(parentId);
    if (parentComment && parentComment.user.toString() !== req.user.id && parentComment.user.toString() !== post.user.toString()) {
      const notif = await Notification.create({ recipient: parentComment.user, sender: req.user.id, type: 'comment', post: post._id, text: `replied to your comment: ${text.substring(0, 30)}...` });
      const io = req.app.get('io');
      const socketId = getReceiverSocketId(parentComment.user.toString());
      if (socketId) {
        const populated = await notif.populate('sender', 'username avatar');
        io.to(socketId).emit('newNotification', populated);
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
  }

  await post.save();
  sendResponse(res, 200, comment.likes);
});

const updatePost = catchAsync(async (req, res) => {
  const { caption, location, tags, images } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) throw new ApiError(404, 'Post not found');
  if (post.user.toString() !== req.user.id) throw new ApiError(403, 'Forbidden');

  if (images && images.length > 0) {
    post.images = images;
    post.image = images[0];
  }

  if (caption !== undefined) post.caption = caption;
  if (location !== undefined) post.location = location;
  if (tags !== undefined) post.tags = tags;

  await post.save();

  const updated = await Post.findById(post._id)
    .populate('user', 'username avatar fullName')
    .populate('tags', 'username avatar');
  sendResponse(res, 200, updated);
});

module.exports = { 
  createPost, 
  getPosts, 
  getFeed, 
  likePost, 
  addComment, 
  deletePost, 
  deleteComment, 
  savePost, 
  getSavedPosts, 
  toggleCommentLike, 
  updatePost 
};
