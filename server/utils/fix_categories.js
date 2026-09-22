/**
 * Fix category names in MongoDB to match the owner UI filter pills.
 * - 'podolu' → 'podulu'  (podi items)
 * - 'other'  → 'other'   (keep, but add pill for appadalu in menu.html)
 * Run: node server/utils/fix_categories.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/subbayya_gari_hotel';

const menuItemSchema = new mongoose.Schema({}, { strict: false });
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to:', MONGO_URI);

  // Fix 'podolu' -> 'podulu' to match filter pill
  const podiRes = await MenuItem.updateMany({ category: 'podolu' }, { $set: { category: 'podulu' } });
  console.log(`Fixed 'podolu' → 'podulu': ${podiRes.modifiedCount} items`);

  // Verify
  const cats = await MenuItem.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  console.log('\nFinal categories:');
  cats.forEach(c => console.log(`  ${c._id}: ${c.count}`));

  await mongoose.disconnect();
  console.log('\nDone!');
}

run().catch(console.error);
