const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    telugu: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    orderType: {
      type: String,
      enum: ['delivery', 'takeaway', 'dine-in', 'online', 'table-booking'],
      default: 'takeaway',
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (val) {
          return val && val.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    packagingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Online Payment', 'Cash on Delivery', 'Pay at Hotel'],
      default: 'UPI',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'Pending',
        'Accepted',
        'Preparing',
        'Ready',
        'Out for Delivery',
        'Completed',
        'Cancelled',
        'Rejected',
      ],
      default: 'Pending',
      index: true,
    },
    deliveryAddress: {
      address: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, default: 'Hyderabad' },
      pincode: { type: String, default: '' },
      locationUrl: { type: String, default: '' },
      distanceKm: { type: Number, default: 0 },
    },
    tableNumber: {
      type: String,
      default: '',
    },
    guestsCount: {
      type: Number,
      default: 1,
    },
    reservationDate: {
      type: String,
      default: '',
    },
    reservationTime: {
      type: String,
      default: '',
    },
    seatingPreference: {
      type: String,
      default: 'Traditional Banana Leaf Seating',
    },
    pickupTime: {
      type: String,
      default: 'ASAP (15-20 Mins)',
    },
    vehicleNote: {
      type: String,
      default: '',
    },
    branch: {
      type: String,
      default: 'KPHB Colony, Hyderabad',
    },
    notes: {
      type: String,
      default: '',
    },
    estimatedPrepTime: {
      type: String,
      default: '20-25 Mins',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Ultra-fast compound indexes for instant sub-millisecond querying
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ orderType: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ phone: 1, createdAt: -1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1, orderStatus: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
