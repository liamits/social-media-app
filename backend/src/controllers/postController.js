const Post = require('../models/Post');
const User = require('../models/User');

const createPost = async (req, res) => {
// ... existing code ...
};

const getPosts = async (req, res) => {
// ... existing code ...
};

const getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const followingIds = [...user.following, user._id];

    const posts = await Post.find({ user: { $in: followingIds } })
      .populate('user', 'username avatar fullName')
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching feed' });
  }
};

const likePost = async (req, res) => {
// ... existing code ...
};

const addComment = async (req, res) => {
// ... existing code ...
};

module.exports = {
  createPost,
  getPosts,
  getFeed,
  likePost,
  addComment
};
