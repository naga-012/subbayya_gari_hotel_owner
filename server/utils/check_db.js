const mongoose = require('mongoose');
require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/subbayya_gari_hotel';

mongoose.connect(MONGO_URI).then(async () => {
  const MenuItem = mongoose.model('MenuItem', new mongoose.Schema({}, { strict: false }));
  const total = await MenuItem.countDocuments({});
  const active = await MenuItem.countDocuments({ isActive: true });
  const cats = await MenuItem.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  console.log('Total items in DB:', total);
  console.log('isActive=true:', active);
  console.log('By category:');
  cats.forEach(c => console.log(' ', c._id, ':', c.count));
  mongoose.disconnect();
}).catch(console.error);
