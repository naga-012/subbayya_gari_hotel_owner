const Setting = require('../models/Setting');

// @desc    Get store settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ key: 'global_settings' });
    if (!settings) {
      settings = await Setting.create({ key: 'global_settings' });
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('[Get Settings Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving settings',
    });
  }
};

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Private / Owner
const updateSettings = async (req, res) => {
  try {
    const {
      restaurantName,
      tagline,
      phone,
      email,
      address,
      openingTime,
      closingTime,
      isOpen,
      closedMessage,
      deliveryFeeBase,
      deliveryFeePerKm,
      packagingFee,
      taxPercent,
      currency,
      upiId,
      upiPayeeName,
    } = req.body;

    let settings = await Setting.findOne({ key: 'global_settings' });
    if (!settings) {
      settings = new Setting({ key: 'global_settings' });
    }

    if (restaurantName !== undefined) settings.restaurantName = restaurantName;
    if (tagline !== undefined) settings.tagline = tagline;
    if (phone !== undefined) settings.phone = phone;
    if (email !== undefined) settings.email = email;
    if (address !== undefined) settings.address = address;
    if (openingTime !== undefined) settings.openingTime = openingTime;
    if (closingTime !== undefined) settings.closingTime = closingTime;
    if (isOpen !== undefined) settings.isOpen = Boolean(isOpen);
    if (closedMessage !== undefined) settings.closedMessage = closedMessage;
    if (deliveryFeeBase !== undefined) settings.deliveryFeeBase = Number(deliveryFeeBase);
    if (deliveryFeePerKm !== undefined) settings.deliveryFeePerKm = Number(deliveryFeePerKm);
    if (packagingFee !== undefined) settings.packagingFee = Number(packagingFee);
    if (taxPercent !== undefined) settings.taxPercent = Number(taxPercent);
    if (currency !== undefined) settings.currency = currency;
    if (upiId !== undefined) settings.upiId = upiId;
    if (upiPayeeName !== undefined) settings.upiPayeeName = upiPayeeName;

    await settings.save();

    // Broadcast store status to active clients
    if (req.io) {
      req.io.emit('store_settings_updated', settings);
    }

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    console.error('[Update Settings Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating settings',
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
