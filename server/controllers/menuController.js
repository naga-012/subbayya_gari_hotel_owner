const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public (filtered) / Owner (full)
const getMenuItems = async (req, res) => {
  try {
    const { category, search, isAvailable, isVeg, isBestseller, isSpecial, all } = req.query;

    let filter = {};

    // For public customer view, only show active items unless all=true requested by owner
    if (!all || all === 'false') {
      filter.isActive = true;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }

    if (isVeg !== undefined) {
      filter.isVeg = isVeg === 'true';
    }

    if (isBestseller !== undefined) {
      filter.isBestseller = isBestseller === 'true';
    }

    if (isSpecial !== undefined) {
      filter.isSpecial = isSpecial === 'true';
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { telugu: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 }).lean();

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('[Get Menu Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving menu items',
    });
  }
};

// @desc    Get single menu item by ID
// @route   GET /api/menu/:id
// @access  Public
const getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id).lean();
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }
    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('[Get MenuItem By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving menu item',
    });
  }
};

// @desc    Create new menu item
// @route   POST /api/menu
// @access  Private / Owner
const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      telugu,
      description,
      category,
      price,
      originalPrice,
      image,
      isAvailable,
      isActive,
      isVeg,
      isBestseller,
      isSpecial,
      preparationTime,
      spiceLevel,
      dietary,
    } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and price are required',
      });
    }

    const item = await MenuItem.create({
      name: name.trim(),
      telugu: telugu ? telugu.trim() : '',
      description: description ? description.trim() : '',
      category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      image: image ? image.trim() : 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
      isBestseller: Boolean(isBestseller),
      isSpecial: Boolean(isSpecial),
      preparationTime: preparationTime || '15-20 Mins',
      spiceLevel: spiceLevel || 'medium',
      dietary: Array.isArray(dietary) ? dietary : [],
    });

    if (req.io) {
      req.io.emit('menu_item_created', item);
      req.io.emit('menu_updated', { action: 'create', item });
      req.io.emit('menu_change', item);
      req.io.emit('menu_refresh');
    }

    return res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: item,
    });
  } catch (error) {
    console.error('[Create MenuItem Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating menu item',
    });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private / Owner
const updateMenuItem = async (req, res) => {
  try {
    let item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    const {
      name,
      telugu,
      description,
      category,
      price,
      originalPrice,
      image,
      isAvailable,
      isActive,
      isVeg,
      isBestseller,
      isSpecial,
      preparationTime,
      spiceLevel,
      dietary,
    } = req.body;

    if (name) item.name = name.trim();
    if (telugu !== undefined) item.telugu = telugu.trim();
    if (description !== undefined) item.description = description.trim();
    if (category) item.category = category;
    if (price !== undefined) item.price = Number(price);
    if (originalPrice !== undefined) item.originalPrice = originalPrice ? Number(originalPrice) : null;
    if (image) item.image = image.trim();
    if (isAvailable !== undefined) item.isAvailable = Boolean(isAvailable);
    if (isActive !== undefined) item.isActive = Boolean(isActive);
    if (isVeg !== undefined) item.isVeg = Boolean(isVeg);
    if (isBestseller !== undefined) item.isBestseller = Boolean(isBestseller);
    if (isSpecial !== undefined) item.isSpecial = Boolean(isSpecial);
    if (preparationTime) item.preparationTime = preparationTime;
    if (spiceLevel) item.spiceLevel = spiceLevel;
    if (dietary !== undefined) item.dietary = Array.isArray(dietary) ? dietary : [];

    await item.save();

    if (req.io) {
      req.io.emit('menu_item_updated', item);
      req.io.emit('menu_updated', { action: 'update', item });
      req.io.emit('menu_change', item);
      req.io.emit('menu_refresh');
    }

    return res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: item,
    });
  } catch (error) {
    console.error('[Update MenuItem Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating menu item',
    });
  }
};

// @desc    Toggle availability (In Stock / Out of Stock) or active status
// @route   PATCH /api/menu/:id/status
// @access  Private / Owner
const toggleMenuItemStatus = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    const { isAvailable, isActive } = req.body;

    if (isAvailable !== undefined) {
      item.isAvailable = Boolean(isAvailable);
    }

    if (isActive !== undefined) {
      item.isActive = Boolean(isActive);
    }

    await item.save();

    if (req.io) {
      req.io.emit('item_availability_changed', { itemId: item._id, isAvailable: item.isAvailable, item });
      req.io.emit('menu_item_status_changed', item);
      req.io.emit('menu_item_updated', item);
      req.io.emit('menu_updated', { action: 'status', item });
      req.io.emit('menu_change', item);
      req.io.emit('menu_refresh');
    }

    return res.status(200).json({
      success: true,
      message: `Menu item status updated (${item.isAvailable ? 'In Stock' : 'Out of Stock'})`,
      data: item,
    });
  } catch (error) {
    console.error('[Toggle MenuItem Status Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating item status',
    });
  }
};

// @desc    Delete menu item (soft delete isActive=false to preserve order history)
// @route   DELETE /api/menu/:id
// @access  Private / Owner
const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Soft delete to preserve historical records
    item.isActive = false;
    item.isAvailable = false;
    await item.save();

    if (req.io) {
      req.io.emit('menu_item_deleted', { itemId: item._id, item });
      req.io.emit('menu_updated', { action: 'delete', item });
      req.io.emit('menu_change', item);
      req.io.emit('menu_refresh');
    }

    return res.status(200).json({
      success: true,
      message: 'Menu item deactivated successfully (historical orders preserved)',
      data: item,
    });
  } catch (error) {
    console.error('[Delete MenuItem Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting menu item',
    });
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemStatus,
  deleteMenuItem,
};
