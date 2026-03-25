const express = require('express');
const { createStory, getStories, viewStory, getViewers, deleteStory } = require('../controllers/storyController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const v = require('../modules/story/story.validation');

const router = express.Router();

router.post('/', auth, validate(v.createStory), createStory);
router.get('/', auth, getStories);
router.put('/:id/view', auth, viewStory);
router.get('/:id/viewers', auth, getViewers);
router.put('/:id/like', auth, toggleStoryLike);
router.delete('/:id', auth, deleteStory);

module.exports = router;
