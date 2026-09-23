const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/subbayya_gari_hotel';

const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', orderSchema);

async function seedBranchOrders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Seed Branches] Connected to MongoDB:', MONGO_URI);

    // 1. Get all current orders
    const orders = await Order.find({}).sort({ createdAt: -1 });
    console.log(`[Seed Branches] Total existing orders in DB: ${orders.length}`);

    const targetBranches = [
      'KPHB Colony, Hyderabad',
      'Kukatpally, Hyderabad',
      'Vanasthalipuram, Hyderabad',
    ];

    if (orders.length > 0) {
      for (let i = 0; i < orders.length; i++) {
        const branchIndex = i % targetBranches.length;
        const assignedBranch = targetBranches[branchIndex];
        await Order.updateOne({ _id: orders[i]._id }, { $set: { branch: assignedBranch } });
      }
      console.log(`[Seed Branches] Rebalanced ${orders.length} orders across:`);
      for (const b of targetBranches) {
        const count = await Order.countDocuments({ branch: b });
        console.log(`  - ${b}: ${count} orders`);
      }
    }

    // Ensure each branch has at least a few fresh active orders for testing
    const now = new Date();
    for (const branch of targetBranches) {
      const activeCount = await Order.countDocuments({
        branch: branch,
        orderStatus: { $in: ['Pending', 'Accepted', 'Preparing'] },
      });

      if (activeCount === 0) {
        const shortName = branch.split(',')[0].trim();
        const sampleOrderNumber = `SGH-${shortName.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;
        await Order.create({
          orderNumber: sampleOrderNumber,
          customerName: `${shortName} Test Patron`,
          phone: '9848022338',
          email: 'patron@subbayyagari.in',
          orderType: 'delivery',
          items: [
            {
              name: 'Subbayya Special Royal Butta Bhojanam',
              price: 515,
              quantity: 2,
              subtotal: 1030,
              category: 'butta',
            },
            {
              name: 'Panasa Mukkala Curry',
              price: 140,
              quantity: 1,
              subtotal: 140,
              category: 'curries',
            }
          ],
          subtotal: 1170,
          packagingFee: 30,
          deliveryCharge: 30,
          discount: 0,
          totalAmount: 1230,
          paymentMethod: 'UPI',
          paymentStatus: 'Paid',
          orderStatus: 'Pending',
          deliveryAddress: {
            address: `Main Road, Near Metro Station, ${shortName}`,
            landmark: `Opposite Subbayya Gari Hotel`,
            city: 'Hyderabad',
            pincode: '500072',
          },
          branch: branch,
          notes: `Fresh hot feast for ${shortName} branch`,
          estimatedPrepTime: '20-25 Mins',
          statusHistory: [
            {
              status: 'Pending',
              timestamp: new Date(),
              note: `Sample order placed for ${shortName} branch`,
            },
          ],
          createdAt: now,
          updatedAt: now,
        });
        console.log(`[Seed Branches] Created new Pending order ${sampleOrderNumber} for ${branch}`);
      }
    }

    const finalCounts = await Order.aggregate([
      { $group: { _id: '$branch', count: { $sum: 1 } } }
    ]);
    console.log('\n[Seed Branches] Final Branch Breakdown:');
    finalCounts.forEach(c => console.log(`  - ${c._id}: ${c.count} orders`));

    await mongoose.disconnect();
    console.log('[Seed Branches] Done!');
    return true;
  } catch (err) {
    console.error('[Seed Branches Error]:', err);
    return false;
  }
}

if (require.main === module) {
  seedBranchOrders().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedBranchOrders;
