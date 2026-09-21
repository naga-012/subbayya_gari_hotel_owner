const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Counter = require('../models/Counter');
const User = require('../models/User');
const Setting = require('../models/Setting');

// Helper to get next sequence order number
const getNextOrderNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { id: 'order_number' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `SGH-${counter.seq}`;
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (Customer)
const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      orderType,
      items,
      deliveryAddress,
      tableNumber,
      guestsCount,
      reservationDate,
      reservationTime,
      seatingPreference,
      pickupTime,
      vehicleNote,
      branch,
      notes,
      paymentMethod,
      appliedPromo,
    } = req.body;

    if (!customerName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone number are required',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    // Check store setting if open
    const settings = await Setting.findOne({ key: 'global_settings' });
    if (settings && !settings.isOpen) {
      return res.status(400).json({
        success: false,
        message: settings.closedMessage || 'Subbayya Gari Hotel is currently closed for new orders.',
      });
    }

    // Verify and snapshot each item directly from database
    let calculatedSubtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const quantity = Math.max(1, parseInt(item.qty || item.quantity || 1, 10));
      let dbItem = null;

      if (item.id || item._id || item.menuItemId) {
        const lookupId = item._id || item.menuItemId || item.id;
        // Search by MongoDB ObjectId or string itemId
        if (typeof lookupId === 'string' && lookupId.match(/^[0-9a-fA-F]{24}$/)) {
          dbItem = await MenuItem.findById(lookupId);
        } else {
          dbItem = await MenuItem.findOne({ itemId: lookupId });
        }
      }

      if (!dbItem && item.name) {
        dbItem = await MenuItem.findOne({ name: new RegExp(`^${item.name.trim()}$`, 'i') });
      }

      const itemPrice = dbItem ? dbItem.price : Number(item.price || 0);
      const itemName = dbItem ? dbItem.name : (item.name || 'Special Item');
      const itemTelugu = dbItem ? dbItem.telugu : (item.telugu || '');
      const itemImage = dbItem ? dbItem.image : (item.image || '');
      const itemCategory = dbItem ? dbItem.category : (item.category || '');
      const itemSubtotal = itemPrice * quantity;

      calculatedSubtotal += itemSubtotal;

      orderItems.push({
        menuItemId: dbItem ? dbItem._id : null,
        name: itemName,
        telugu: itemTelugu,
        price: itemPrice,
        quantity: quantity,
        subtotal: itemSubtotal,
        image: itemImage,
        category: itemCategory,
      });
    }

    // Calculate packaging, delivery, tax, discount
    const isDineIn = orderType === 'dine-in' || orderType === 'table-booking';
    const packagingFee = isDineIn ? 0 : (settings ? (settings.packagingFee || 30) : 30);
    
    let deliveryCharge = 0;
    const type = isDineIn ? 'dine-in' : (orderType || 'takeaway');
    if (type === 'delivery') {
      const distance = deliveryAddress?.distanceKm || 2;
      const baseFee = settings ? (settings.deliveryFeeBase || 30) : 30;
      const perKm = settings ? (settings.deliveryFeePerKm || 10) : 10;
      if (distance <= 2) {
        deliveryCharge = baseFee;
      } else {
        deliveryCharge = baseFee + Math.round((distance - 2) * perKm);
      }
    }

    let discount = 0;
    if (appliedPromo === 'BUTTA10' || req.body.promoCode === 'BUTTA10') {
      discount = Math.round(calculatedSubtotal * 0.10);
    }

    const grandTotal = calculatedSubtotal + packagingFee + deliveryCharge - discount;

    const orderNumber = await getNextOrderNumber();

    // Check if customer is registered user or associate phone
    let customerId = null;
    if (req.user) {
      customerId = req.user._id;
    } else {
      const existingUser = await User.findOne({ phone: phone.trim() });
      if (existingUser) {
        customerId = existingUser._id;
      }
    }

      let finalLocationUrl = deliveryAddress?.locationUrl || '';
      if (!finalLocationUrl && (deliveryAddress?.address || deliveryAddress?.landmark)) {
        const fullAddrQuery = [deliveryAddress.address, deliveryAddress.landmark, deliveryAddress.city || 'Hyderabad', deliveryAddress.pincode].filter(Boolean).join(', ');
        finalLocationUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddrQuery)}`;
      }

      const newOrder = await Order.create({
      orderNumber,
      customerId,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      orderType: type,
      items: orderItems,
      subtotal: calculatedSubtotal,
      packagingFee,
      deliveryCharge,
      discount,
      totalAmount: grandTotal,
      paymentMethod: paymentMethod || (isDineIn ? 'Pay at Hotel' : 'UPI'),
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      deliveryAddress: {
        address: deliveryAddress?.address || '',
        landmark: deliveryAddress?.landmark || '',
        city: deliveryAddress?.city || 'Hyderabad',
        pincode: deliveryAddress?.pincode || '',
        locationUrl: finalLocationUrl,
        distanceKm: deliveryAddress?.distanceKm || (type === 'delivery' ? 2 : 0),
      },
      tableNumber: tableNumber || '',
      guestsCount: guestsCount ? parseInt(guestsCount, 10) : 1,
      reservationDate: reservationDate || '',
      reservationTime: reservationTime || '',
      seatingPreference: seatingPreference || 'Traditional Banana Leaf Seating',
      pickupTime: pickupTime || (reservationDate && reservationTime ? `${reservationDate} at ${reservationTime}` : 'ASAP (15-20 Mins)'),
      vehicleNote: vehicleNote || '',
      branch: branch || 'KPHB Colony, Hyderabad',
      notes: notes || '',
      estimatedPrepTime: isDineIn ? 'Table Reserved' : '20-25 Mins',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: new Date(),
          note: isDineIn ? 'Table booking reservation placed by customer via web application' : 'Order placed by customer via web application',
        },
      ],
    });

    // Real-time broadcast to owner dashboard via Socket.IO
    if (req.io) {
      const socketPayload = {
        order: newOrder,
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerName,
        totalAmount: newOrder.totalAmount,
        orderType: newOrder.orderType,
        createdAt: newOrder.createdAt,
      };
      req.io.emit('new_order', socketPayload);
      req.io.to('owner_room').emit('new_order', socketPayload);
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: newOrder,
    });
  } catch (error) {
    console.error('[Create Order Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating order',
    });
  }
};

// @desc    Get all orders (Owner view with filters)
// @route   GET /api/orders
// @access  Private / Owner
const getOrders = async (req, res) => {
  try {
    const {
      status,
      orderType,
      paymentStatus,
      dateRange,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    let filter = {};

    // Status filter
    if (status && status !== 'all') {
      if (status === 'active' || status === 'not-completed' || status === 'in-progress' || status === 'Not Completed') {
        filter.orderStatus = { $nin: ['Completed', 'Cancelled', 'Rejected'] };
      } else {
        filter.orderStatus = status;
      }
    }

    // Order type filter
    if (orderType && orderType !== 'all') {
      if (orderType === 'dine-in' || orderType === 'table-booking') {
        filter.orderType = { $in: ['dine-in', 'table-booking'] };
      } else {
        filter.orderType = orderType;
      }
    }

    // Payment status filter
    if (paymentStatus && paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus;
    }

    // Search filter (Order ID, Customer Name, Phone)
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { orderNumber: searchRegex },
        { customerName: searchRegex },
        { phone: searchRegex },
        { 'items.name': searchRegex },
      ];
    }

    // Date range filter (supports Indian Standard Time IST UTC+5:30 on Render cloud servers)
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffsetMs);
    const startOfTodayIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate(), 0, 0, 0) - istOffsetMs);
    const endOfTodayIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate(), 23, 59, 59, 999) - istOffsetMs);

    if (dateRange === 'today') {
      filter.createdAt = { $gte: startOfTodayIST, $lte: endOfTodayIST };
    } else if (dateRange === '2days' || dateRange === 'past2days') {
      const twoDaysAgo = new Date(startOfTodayIST.getTime() - 24 * 60 * 60 * 1000);
      filter.createdAt = { $gte: twoDaysAgo };
    } else if (dateRange === 'yesterday') {
      const startOfYesterday = new Date(startOfTodayIST.getTime() - 24 * 60 * 60 * 1000);
      const endOfYesterday = new Date(startOfTodayIST.getTime() - 1);
      filter.createdAt = { $gte: startOfYesterday, $lte: endOfYesterday };
    } else if (dateRange === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filter.createdAt = { $gte: sevenDaysAgo };
    } else if (dateRange === '30days') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filter.createdAt = { $gte: thirtyDaysAgo };
    } else if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = eDate;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Active / In-progress (Not Completed) filter for live tab badge counts
    const activeFilter = { orderStatus: { $nin: ['Completed', 'Cancelled', 'Rejected'] } };

    // Run parallel queries with not-completed / active orders sorted to the top
    const [total, orders, totalAll, totalDineIn, totalDelivery, totalTakeaway] = await Promise.all([
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: filter },
        {
          $addFields: {
            statusPriority: {
              $switch: {
                branches: [
                  { case: { $eq: ['$orderStatus', 'Pending'] }, then: 1 },
                  { case: { $eq: ['$orderStatus', 'Accepted'] }, then: 2 },
                  { case: { $eq: ['$orderStatus', 'Preparing'] }, then: 3 },
                  { case: { $eq: ['$orderStatus', 'Ready'] }, then: 4 },
                  { case: { $eq: ['$orderStatus', 'Out for Delivery'] }, then: 5 },
                  { case: { $eq: ['$orderStatus', 'Completed'] }, then: 6 },
                  { case: { $eq: ['$orderStatus', 'Cancelled'] }, then: 7 },
                  { case: { $eq: ['$orderStatus', 'Rejected'] }, then: 8 },
                ],
                default: 9,
              },
            },
          },
        },
        { $sort: { statusPriority: 1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
      ]),
      Order.countDocuments(activeFilter),
      Order.countDocuments({ orderType: { $in: ['dine-in', 'table-booking'] }, ...activeFilter }),
      Order.countDocuments({ orderType: 'delivery', ...activeFilter }),
      Order.countDocuments({ orderType: 'takeaway', ...activeFilter }),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      typeCounts: {
        all: totalAll,
        dineIn: totalDineIn,
        delivery: totalDelivery,
        takeaway: totalTakeaway,
      },
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: orders,
    });
  } catch (error) {
    console.error('[Get Orders Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving orders',
    });
  }
};

// @desc    Get order details by ID or OrderNumber
// @route   GET /api/orders/:id
// @access  Public (Tracking) / Private (Owner)
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }

    if (!order) {
      order = await Order.findOne({ orderNumber: id.toUpperCase().trim() });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('[Get Order By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving order details',
    });
  }
};

// @desc    Update order status (Pending -> Accepted -> Preparing -> Ready -> Out for Delivery -> Completed / Cancelled / Rejected)
// @route   PATCH /api/orders/:id/status
// @access  Private / Owner
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, note } = req.body;

    const validStatuses = [
      'Pending',
      'Accepted',
      'Preparing',
      'Ready',
      'Out for Delivery',
      'Completed',
      'Cancelled',
      'Rejected',
    ];

    if (!orderStatus || !validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    let order = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id.toUpperCase().trim() });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.orderStatus = orderStatus;
    order.statusHistory.push({
      status: orderStatus,
      timestamp: new Date(),
      note: note || `Order marked as ${orderStatus} by owner`,
    });

    // Auto update payment if completed with cash on delivery
    if (orderStatus === 'Completed' && order.paymentStatus === 'Pending') {
      order.paymentStatus = 'Paid';
    }

    await order.save();

    // Real-time broadcast status change
    if (req.io) {
      req.io.emit('order_status_updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        updatedAt: order.updatedAt,
        order: order,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber} status changed to ${orderStatus}`,
      data: order,
    });
  } catch (error) {
    console.error('[Update Order Status Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating order status',
    });
  }
};

// @desc    Update order payment status
// @route   PATCH /api/orders/:id/payment
// @access  Private / Owner
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const validStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
    if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    let order = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id.toUpperCase().trim() });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    if (req.io) {
      req.io.emit('order_status_updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        order: order,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber} payment status updated to ${paymentStatus}`,
      data: order,
    });
  } catch (error) {
    console.error('[Update Payment Status Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating payment status',
    });
  }
};

// @desc    Track order by orderNumber (Customer live tracking)
// @route   GET /api/orders/track/:orderNumber
// @access  Public
const trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const cleanNumber = orderNumber.toUpperCase().trim();

    const order = await Order.findOne({ orderNumber: cleanNumber });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `No order found with tracking number #${cleanNumber}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        orderType: order.orderType,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        items: order.items,
        subtotal: order.subtotal,
        packagingFee: order.packagingFee,
        deliveryCharge: order.deliveryCharge,
        discount: order.discount,
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        tableNumber: order.tableNumber,
        pickupTime: order.pickupTime,
        branch: order.branch,
        estimatedPrepTime: order.estimatedPrepTime,
        statusHistory: order.statusHistory,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Track Order Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving live tracking information',
    });
  }
};

// @desc    Delete/Cancel order
// @route   DELETE /api/orders/:id
// @access  Private / Owner
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id.toUpperCase().trim() });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.orderStatus = 'Cancelled';
    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      note: 'Order cancelled by owner',
    });
    await order.save();

    if (req.io) {
      req.io.emit('order_status_updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: 'Cancelled',
        order: order,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber} has been cancelled`,
      data: order,
    });
  } catch (error) {
    console.error('[Delete Order Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error cancelling order',
    });
  }
};

// @desc    Update / Allocate table number for dine-in order
// @route   PATCH /api/orders/:id/table
// @access  Private / Owner
const updateTableNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNumber } = req.body;

    let order = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id.toUpperCase().trim() });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.tableNumber = (tableNumber || '').trim();
    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Table allocated: #${order.tableNumber} by owner`,
    });

    await order.save();

    if (req.io) {
      req.io.emit('order_status_updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        orderStatus: order.orderStatus,
        order: order,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Table #${order.tableNumber} allocated to order #${order.orderNumber}`,
      data: order,
    });
  } catch (error) {
    console.error('[Update Table Number Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error allocating table number',
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateTableNumber,
  trackOrder,
  deleteOrder,
};

