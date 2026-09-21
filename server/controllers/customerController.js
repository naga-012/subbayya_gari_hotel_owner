const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get all customers with order statistics
// @route   GET /api/customers
// @access  Private / Owner
const getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;

    // Get customer stats from Orders aggregation
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$phone',
          customerName: { $last: '$customerName' },
          email: { $last: '$email' },
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [
                { $ne: ['$orderStatus', 'Cancelled'] },
                '$totalAmount',
                0,
              ],
            },
          },
          lastOrderDate: { $max: '$createdAt' },
          lastOrderNumber: { $last: '$orderNumber' },
          lastDeliveryAddress: { $last: '$deliveryAddress' },
        },
      },
      { $sort: { lastOrderDate: -1 } },
    ]);

    // Also get registered users
    const registeredUsers = await User.find({ role: 'customer' }).lean();
    const userPhoneMap = new Map();
    registeredUsers.forEach((u) => {
      if (u.phone) userPhoneMap.set(u.phone, u);
    });

    let customers = orderStats.map((stat) => {
      const regUser = userPhoneMap.get(stat._id);
      const addr = stat.lastDeliveryAddress?.address || regUser?.address || '';
      const locationUrl = stat.lastDeliveryAddress?.locationUrl || (addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : '');
      return {
        id: regUser ? regUser._id : stat._id,
        customerId: regUser ? `CUST-${String(regUser._id).slice(-6).toUpperCase()}` : `GUEST-${stat._id.slice(-4)}`,
        name: regUser ? regUser.name : stat.customerName,
        phone: stat._id,
        email: regUser ? regUser.email : (stat.email || 'N/A'),
        address: addr,
        locationUrl: locationUrl,
        totalOrders: stat.totalOrders,
        totalSpent: stat.totalSpent,
        lastOrderDate: stat.lastOrderDate,
        lastOrderNumber: stat.lastOrderNumber,
        isRegistered: Boolean(regUser),
        tier: regUser ? regUser.tier : 'Guest',
        loyaltyCoins: regUser ? regUser.loyaltyCoins : 0,
        status: (regUser && !regUser.isActive) ? 'Inactive' : 'Active',
      };
    });

    // If there are registered users who haven't ordered yet
    registeredUsers.forEach((u) => {
      const alreadyIncluded = customers.some((c) => c.phone === u.phone);
      if (!alreadyIncluded && u.phone) {
        const addr = u.address || '';
        customers.push({
          id: u._id,
          customerId: `CUST-${String(u._id).slice(-6).toUpperCase()}`,
          name: u.name,
          phone: u.phone,
          email: u.email,
          address: addr,
          locationUrl: addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : '',
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
          lastOrderNumber: null,
          isRegistered: true,
          tier: u.tier || 'Silver',
          loyaltyCoins: u.loyaltyCoins || 50,
          status: u.isActive ? 'Active' : 'Inactive',
        });
      }
    });

    // Search filter
    if (search) {
      const s = search.toLowerCase().trim();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.phone.toLowerCase().includes(s) ||
          c.email.toLowerCase().includes(s) ||
          c.customerId.toLowerCase().includes(s)
      );
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = customers.slice(startIndex, startIndex + limitNum);

    return res.status(200).json({
      success: true,
      count: paginated.length,
      total: customers.length,
      page: pageNum,
      pages: Math.ceil(customers.length / limitNum),
      data: paginated,
    });
  } catch (error) {
    console.error('[Get Customers Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving customer directory',
    });
  }
};

// @desc    Get single customer profile with full order history
// @route   GET /api/customers/:id
// @access  Private / Owner
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    let user = null;
    let phoneQuery = id;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id);
      if (user && user.phone) {
        phoneQuery = user.phone;
      }
    }

    // Retrieve all orders associated with phone
    const orders = await Order.find({
      $or: [{ phone: phoneQuery }, { customerId: user ? user._id : null }],
    }).sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const totalSpent = orders
      .filter((o) => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Rejected')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const firstOrderWithAddr = orders.find((o) => o.deliveryAddress && o.deliveryAddress.address);
    const resolvedAddress = user?.address || firstOrderWithAddr?.deliveryAddress?.address || 'N/A';
    const resolvedLocationUrl = firstOrderWithAddr?.deliveryAddress?.locationUrl || (resolvedAddress !== 'N/A' ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resolvedAddress)}` : '');

    const customerProfile = {
      id: user ? user._id : phoneQuery,
      customerId: user ? `CUST-${String(user._id).slice(-6).toUpperCase()}` : `GUEST-${phoneQuery.slice(-4)}`,
      name: user ? user.name : (orders[0]?.customerName || 'Customer'),
      phone: phoneQuery,
      email: user ? user.email : (orders[0]?.email || 'N/A'),
      address: resolvedAddress,
      locationUrl: resolvedLocationUrl,
      deliveryAddress: firstOrderWithAddr?.deliveryAddress || null,
      isRegistered: Boolean(user),
      tier: user ? user.tier : 'Guest',
      loyaltyCoins: user ? user.loyaltyCoins : 0,
      totalOrders,
      totalSpent,
      orders,
    };

    return res.status(200).json({
      success: true,
      data: customerProfile,
    });
  } catch (error) {
    console.error('[Get Customer Details Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving customer profile',
    });
  }
};

// @desc    Get order history for customer
// @route   GET /api/customers/:id/orders
// @access  Private / Owner
const getCustomerOrders = async (req, res) => {
  try {
    const { id } = req.params;
    let phone = id;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      const user = await User.findById(id);
      if (user && user.phone) phone = user.phone;
    }

    const orders = await Order.find({ phone }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('[Get Customer Orders Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving customer orders',
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  getCustomerOrders,
};
