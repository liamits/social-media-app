const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const validate = require('../middlewares/validate');
const v = require('../modules/auth/auth.validation');
const auth = require('../middlewares/auth');

const router = express.Router();

router.post('/register', validate(v.register), register);
router.post('/login', validate(v.login), login);
router.get('/me', auth, getMe);

module.exports = router;
