const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global_settings',
      unique: true,
    },
    restaurantName: {
      type: String,
      default: 'Subbayya Gari Hotel',
    },
    tagline: {
      type: String,
      default: 'Authentic Andhra Pure Veg Butta Bhojanam Since 1950',
    },
    phone: {
      type: String,
      default: '+91 90108 88842',
    },
    email: {
      type: String,
      default: 'contact@subbayyagarihotel.com',
    },
    address: {
      type: String,
      default: 'MIG 295, Rd No. 4, KPHB Colony, Kukatpally, Hyderabad, Telangana 500072',
    },
    openingTime: {
      type: String,
      default: '11:00 AM',
    },
    closingTime: {
      type: String,
      default: '11:00 PM',
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    closedMessage: {
      type: String,
      default: 'Subbayya Gari Hotel is currently closed for kitchen rest. We look forward to serving you fresh Godavari feasts during opening hours!',
    },
    deliveryFeeBase: {
      type: Number,
      default: 30, // For <= 2km
    },
    deliveryFeePerKm: {
      type: Number,
      default: 10,
    },
    packagingFee: {
      type: Number,
      default: 30,
    },
    taxPercent: {
      type: Number,
      default: 5,
    },
    currency: {
      type: String,
      default: '₹',
    },
    upiId: {
      type: String,
      default: 'subbayyahotel@icici',
    },
    upiPayeeName: {
      type: String,
      default: 'Subbayya Gari Hotel KPHB',
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);
module.exports = Setting;
