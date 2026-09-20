const express = require('express');
const router = express.Router();
const {
  getStats,
  getRevenue,
  getTopItems,
  getOrderSummary,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { ownerOnly } = require('../middleware/owner');

router.get('/stats', protect, ownerOnly, getStats);
router.get('/revenue', protect, ownerOnly, getRevenue);
router.get('/top-items', protect, ownerOnly, getTopItems);
router.get('/order-summary', protect, ownerOnly, getOrderSummary);

module.exports = router;
