const express = require('express');
const { createPost, getPosts, getFeed, likePost, addComment, deletePost, deleteComment, savePost, getSavedPosts } = require('../controllers/postController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const v = require('../modules/post/post.validation');

const router = express.Router();

router.post('/', auth, validate(v.createPost), createPost);
router.get('/', getPosts);
router.get('/feed', auth, getFeed);
router.get('/saved', auth, getSavedPosts);
router.put('/:id/like', auth, likePost);
router.put('/:id/save', auth, savePost);
router.post('/:id/comment', auth, validate(v.addComment), addComment);
router.delete('/:id', auth, deletePost);
router.put('/:id/like', auth, toggleCommentLike);
router.delete('/:id/comment/:commentId', auth, deleteComment);

module.exports = router;
