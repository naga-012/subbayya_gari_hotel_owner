const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  getCustomerOrders,
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const { ownerOnly } = require('../middleware/owner');

router.get('/', protect, ownerOnly, getCustomers);
router.get('/:id', protect, ownerOnly, getCustomerById);
router.get('/:id/orders', protect, ownerOnly, getCustomerOrders);

module.exports = router;
