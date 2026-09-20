const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide item name'],
      trim: true,
      index: true,
    },
    telugu: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide category'],
      enum: ['butta', 'rice', 'curries', 'pickles', 'podulu', 'sweets', 'starters', 'combos', 'beverages', 'specials', 'other'],
      default: 'curries',
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide item price'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
    isSpecial: {
      type: Boolean,
      default: false,
    },
    preparationTime: {
      type: String,
      default: '15-20 Mins',
    },
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'spicy', 'extra-spicy'],
      default: 'medium',
    },
    dietary: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviews: {
      type: Number,
      default: 120,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast query
menuItemSchema.index({ category: 1, isAvailable: 1, isActive: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
module.exports = MenuItem;
