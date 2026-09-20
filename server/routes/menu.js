const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemStatus,
  deleteMenuItem,
} = require('../controllers/menuController');
const { protect } = require('../middleware/auth');
const { ownerOnly } = require('../middleware/owner');

// Public routes
router.get('/', getMenuItems);
router.get('/:id', getMenuItemById);

// Owner protected routes
router.post('/', protect, ownerOnly, createMenuItem);
router.put('/:id', protect, ownerOnly, updateMenuItem);
router.patch('/:id/status', protect, ownerOnly, toggleMenuItemStatus);
router.delete('/:id', protect, ownerOnly, deleteMenuItem);

module.exports = router;
