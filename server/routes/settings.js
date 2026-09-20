const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect } = require('../middleware/auth');
const { ownerOnly } = require('../middleware/owner');

router.get('/', getSettings);
router.put('/', protect, ownerOnly, updateSettings);

module.exports = router;
