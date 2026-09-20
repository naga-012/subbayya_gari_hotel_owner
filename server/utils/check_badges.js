const mongoose = require('mongoose');
const Order = require('../models/Order');
const connectDB = require('../config/db');

async function testCounts() {
  await connectDB();
  const totalInDb = await Order.countDocuments({});
  const completedInDb = await Order.countDocuments({ orderStatus: 'Completed' });
  const activeInDb = await Order.countDocuments({ orderStatus: { $nin: ['Completed', 'Cancelled', 'Rejected'] } });
  
  const activeDineIn = await Order.countDocuments({ orderType: { $in: ['dine-in', 'table-booking'] }, orderStatus: { $nin: ['Completed', 'Cancelled', 'Rejected'] } });
  const activeDelivery = await Order.countDocuments({ orderType: 'delivery', orderStatus: { $nin: ['Completed', 'Cancelled', 'Rejected'] } });
  const activeTakeaway = await Order.countDocuments({ orderType: 'takeaway', orderStatus: { $nin: ['Completed', 'Cancelled', 'Rejected'] } });

  console.log('--- DATABASE ORDER AUDIT ---');
  console.log('Total Orders stored in DB:', totalInDb);
  console.log('Completed orders in DB:', completedInDb);
  console.log('ACTIVE UNCOMPLETED ORDERS (Badge counts):', activeInDb);
  console.log('  Active Table Bookings:', activeDineIn);
  console.log('  Active Home Delivery:', activeDelivery);
  console.log('  Active Takeaway:', activeTakeaway);
  process.exit(0);
}
testCounts();
