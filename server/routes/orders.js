const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateTableNumber,
  trackOrder,
  deleteOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { ownerOnly } = require('../middleware/owner');

// Public customer routes
router.post('/', createOrder);
router.get('/track/:orderNumber', trackOrder);
router.get('/:id', getOrderById);

// Owner protected routes
router.get('/', protect, ownerOnly, getOrders);
router.patch('/:id/status', protect, ownerOnly, updateOrderStatus);
router.patch('/:id/payment', protect, ownerOnly, updatePaymentStatus);
router.patch('/:id/table', protect, ownerOnly, updateTableNumber);
router.delete('/:id', protect, ownerOnly, deleteOrder);

module.exports = router;
