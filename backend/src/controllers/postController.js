const Post = require('../models/Post');

const createPost = async (req, res) => {
  try {
    const { image, caption, location } = req.body;
    
    const newPost = new Post({
      user: req.user.id,
      image,
      caption,
      location
    });

    const savedPost = await newPost.save();
    await savedPost.populate('user', 'username avatar fullName');
    
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ message: 'Error creating post' });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username avatar fullName')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

module.exports = {
  createPost,
  getPosts
};
