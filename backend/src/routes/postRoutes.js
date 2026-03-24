const express = require('express');
const router = express.Router();
const { createPost, getPosts } = require('../controllers/postController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, createPost);
router.get('/', getPosts);

module.exports = router;
