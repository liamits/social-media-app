const express = require('express');
const router = express.Router();
const { getUserProfile, followUnfollowUser, searchUsers, updateProfile, getUserById, getSuggestions } = require('../controllers/userController');

router.get('/suggestions', auth, getSuggestions);
const auth = require('../middleware/authMiddleware');

router.get('/search', searchUsers);
router.get('/profile/:username', getUserProfile);
router.get('/profile/id/:id', getUserById);
router.put('/follow/:id', auth, followUnfollowUser);
router.put('/update', auth, updateProfile);

module.exports = router;
