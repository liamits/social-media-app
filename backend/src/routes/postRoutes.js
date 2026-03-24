const express = require('express');
const router = express.Router();
const { createPost, getPosts, getFeed, likePost, addComment } = require('../controllers/postController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, createPost);
router.get('/', getPosts);
router.get('/feed', auth, getFeed);
router.put('/:id/like', auth, likePost);
router.post('/:id/comment', auth, addComment);

module.exports = router;
