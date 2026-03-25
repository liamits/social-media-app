const Story = require('../models/Story');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getReceiverSocketId } = require('../socket/socket');
const catchAsync = require('../common/catchAsync');
const ApiError = require('../common/ApiError');
const { sendResponse } = require('../common/response');

const createStory = catchAsync(async (req, res) => {
  const { image, text, textStyle, tags } = req.body;
  const story = await Story.create({ user: req.user.id, image, text, textStyle, tags });
  
  // Send notifications to tagged users
  if (tags && tags.length > 0) {
    const io = req.app.get('io');
    for (const tagId of tags) {
      const notif = await Notification.create({ recipient: tagId, sender: req.user.id, type: 'tag', text: 'tagged you in a story' });
      const socketId = getReceiverSocketId(tagId.toString());
      if (socketId) {
        const populated = await notif.populate('sender', 'username avatar');
        io.to(socketId).emit('newNotification', populated);
      }
    }
  }

  await story.populate([
    { path: 'user', select: 'username avatar' },
    { path: 'tags', select: 'username avatar' }
  ]);
  sendResponse(res, 201, story);
});

const getStories = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  const ids = [...user.following, user._id];

  const stories = await Story.find({ user: { $in: ids }, expiresAt: { $gt: new Date() } })
    .populate('user', 'username avatar')
    .populate('tags', 'username avatar')
    .sort({ createdAt: -1 });

  const grouped = {};
  stories.forEach(s => {
    const uid = s.user._id.toString();
    if (!grouped[uid]) grouped[uid] = { user: s.user, stories: [] };
    grouped[uid].stories.push(s);
  });

  sendResponse(res, 200, Object.values(grouped));
});

const viewStory = catchAsync(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) throw new ApiError(404, 'Story not found');

  if (!story.viewers.includes(req.user.id)) {
    story.viewers.push(req.user.id);
    await story.save();
  }
  sendResponse(res, 200, null, 'ok');
});

const getViewers = catchAsync(async (req, res) => {
  const story = await Story.findById(req.params.id).populate('viewers', 'username avatar');
  if (!story) throw new ApiError(404, 'Story not found');
  if (story.user.toString() !== req.user.id) throw new ApiError(403, 'Unauthorized');
  sendResponse(res, 200, story.viewers);
});

const deleteStory = catchAsync(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) throw new ApiError(404, 'Story not found');
  if (story.user.toString() !== req.user.id) throw new ApiError(403, 'Unauthorized');
  await story.deleteOne();
  sendResponse(res, 200, null, 'Story deleted');
});

const toggleStoryLike = catchAsync(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) throw new ApiError(404, 'Story not found');

  const isLiked = story.likes.includes(req.user.id);
  if (isLiked) {
    story.likes = story.likes.filter(id => id.toString() !== req.user.id);
  } else {
    story.likes.push(req.user.id);
    if (story.user.toString() !== req.user.id) {
      const notif = await Notification.create({
        recipient: story.user,
        sender: req.user.id,
        type: 'like',
        text: 'liked your story'
      });
      const io = req.app.get('io');
      const socketId = getReceiverSocketId(story.user.toString());
      if (socketId) {
        const populated = await notif.populate('sender', 'username avatar');
        io.to(socketId).emit('newNotification', populated);
      }
    }
  }

  await story.save();
  sendResponse(res, 200, story.likes);
});

module.exports = { createStory, getStories, viewStory, getViewers, deleteStory, toggleStoryLike };
