const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/stats
// @access  Private / Owner
const getStats = async (req, res) => {
  try {
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffsetMs);
    const startOfToday = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate(), 0, 0, 0) - istOffsetMs);
    const endOfToday = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate(), 23, 59, 59, 999) - istOffsetMs);

    // Parallel single-pass aggregation pipelines for zero loading time
    const [todayAgg, statusAgg, lifetimeAgg, registeredCustomersCount, uniquePhones] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday, $lte: endOfToday } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $in: ['$orderStatus', ['Cancelled', 'Rejected']] }, 0, '$totalAmount'],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            orderStatus: { $in: ['Completed', 'Ready', 'Out for Delivery', 'Preparing', 'Accepted'] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      User.countDocuments({ role: 'customer' }),
      Order.distinct('phone'),
    ]);

    const statusMap = {};
    let totalOrdersCount = 0;
    statusAgg.forEach((s) => {
      statusMap[s._id] = s.count;
      totalOrdersCount += s.count;
    });

    const todayOrdersCount = todayAgg[0]?.count || 0;
    const todayRevenue = todayAgg[0]?.revenue || 0;
    const totalRevenue = lifetimeAgg[0]?.totalRevenue || 0;
    const completedCount = lifetimeAgg[0]?.count || 0;
    const avgOrderValue = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;
    const totalCustomers = Math.max(registeredCustomersCount, uniquePhones.length);

    return res.status(200).json({
      success: true,
      data: {
        todayOrders: todayOrdersCount,
        todayRevenue,
        pendingOrders: statusMap['Pending'] || 0,
        acceptedOrders: statusMap['Accepted'] || 0,
        preparingOrders: statusMap['Preparing'] || 0,
        readyOrders: statusMap['Ready'] || 0,
        outForDeliveryOrders: statusMap['Out for Delivery'] || 0,
        completedOrders: statusMap['Completed'] || 0,
        cancelledOrders: statusMap['Cancelled'] || 0,
        totalOrders: totalOrdersCount,
        totalCustomers,
        totalRevenue,
        avgOrderValue,
      },
    });
  } catch (error) {
    console.error('[Get Dashboard Stats Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error calculating dashboard statistics',
    });
  }
};

// @desc    Get daily revenue trend for charts (Chart.js)
// @route   GET /api/dashboard/revenue
// @access  Private / Owner
const getRevenue = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const numDays = parseInt(days, 10) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (numDays - 1));
    startDate.setHours(0, 0, 0, 0);

    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['Cancelled', 'Rejected'] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days so the chart shows a complete timeline
    const timeline = [];
    const dateMap = new Map();
    revenueData.forEach((item) => dateMap.set(item._id, item));

    for (let i = 0; i < numDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      if (dateMap.has(dateStr)) {
        timeline.push({
          date: dateStr,
          label: dayName,
          revenue: dateMap.get(dateStr).revenue,
          orders: dateMap.get(dateStr).orders,
        });
      } else {
        timeline.push({
          date: dateStr,
          label: dayName,
          revenue: 0,
          orders: 0,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    console.error('[Get Revenue Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving revenue analytics',
    });
  }
};

// @desc    Get top selling menu items calculated from real database orders
// @route   GET /api/dashboard/top-items
// @access  Private / Owner
const getTopItems = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit, 10) || 10;

    const topItems = await Order.aggregate([
      {
        $match: {
          orderStatus: { $nin: ['Cancelled', 'Rejected'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          itemCategory: { $last: '$items.category' },
          image: { $last: '$items.image' },
        },
      },
      { $sort: { totalQuantity: -1, totalRevenue: -1 } },
      { $limit: limitNum },
    ]);

    return res.status(200).json({
      success: true,
      count: topItems.length,
      data: topItems.map((item) => ({
        name: item._id,
        category: item.itemCategory || 'General',
        ordersCount: item.totalQuantity,
        revenue: item.totalRevenue,
        image: item.image,
      })),
    });
  } catch (error) {
    console.error('[Get Top Items Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error calculating best selling items',
    });
  }
};

// @desc    Get breakdown summary of orders by status, type, and payment
// @route   GET /api/dashboard/order-summary
// @access  Private / Owner
const getOrderSummary = async (req, res) => {
  try {
    const [byStatus, byType, byPayment] = await Promise.all([
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $group: { _id: '$orderType', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        byStatus,
        byType,
        byPayment,
      },
    });
  } catch (error) {
    console.error('[Get Order Summary Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error calculating order summary breakdown',
    });
  }
};

module.exports = {
  getStats,
  getRevenue,
  getTopItems,
  getOrderSummary,
};
