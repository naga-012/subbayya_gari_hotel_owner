const express = require('express');
const router = express.Router();
const { login, register, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.post('/logout', logout);

module.exports = router;
