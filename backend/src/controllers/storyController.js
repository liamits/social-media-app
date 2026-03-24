const Story = require('../models/Story');
const User = require('../models/User');
const catchAsync = require('../common/utils/catchAsync');
const ApiError = require('../common/utils/ApiError');
const { sendResponse } = require('../common/utils/response');

const createStory = catchAsync(async (req, res) => {
  const { image, text, textStyle } = req.body;
  const story = await Story.create({ user: req.user.id, image, text, textStyle });
  await story.populate('user', 'username avatar');
  sendResponse(res, 201, story);
});

const getStories = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  const ids = [...user.following, user._id];

  const stories = await Story.find({ user: { $in: ids }, expiresAt: { $gt: new Date() } })
    .populate('user', 'username avatar')
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

module.exports = { createStory, getStories, viewStory, getViewers, deleteStory };
