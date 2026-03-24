const express = require('express');
const { getUserProfile, followUnfollowUser, searchUsers, updateProfile, getUserById, getSuggestions, getFollowers, getFollowing } = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const validate = require('../common/middlewares/validate');
const v = require('../modules/user/user.validation');

const router = express.Router();

router.get('/suggestions', auth, getSuggestions);
router.get('/search', validate(v.search), searchUsers);
router.get('/profile/:username', getUserProfile);
router.get('/profile/id/:id', getUserById);
router.put('/follow/:id', auth, followUnfollowUser);
router.put('/update', auth, validate(v.updateProfile), updateProfile);
router.get('/:id/followers', auth, getFollowers);
router.get('/:id/following', auth, getFollowing);

module.exports = router;
