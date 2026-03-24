const express = require('express');
const router = express.Router();
const { getUserProfile, followUnfollowUser, searchUsers, updateProfile } = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

router.get('/search', searchUsers);
router.get('/profile/:username', getUserProfile);
router.put('/follow/:id', auth, followUnfollowUser);
router.put('/update', auth, updateProfile);

module.exports = router;
