const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Setting = require('../models/Setting');
const Counter = require('../models/Counter');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DEFAULT_MENU_ITEMS = [
  // --- BUTTA BHOJANAM & MEALS ---
  {
    itemId: 'meal-butta',
    name: 'Butta Bojanam',
    telugu: 'బుట్ట భోజనం',
    category: 'butta',
    price: 515,
    originalPrice: 599,
    rating: 5.0,
    reviews: 3240,
    spiceLevel: 'medium',
    dietary: ['jain-available', 'chef-special'],
    isBestseller: true,
    isSpecial: true,
    isVeg: true,
    preparationTime: '15-20 Mins',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
    description: 'The legendary bamboo basket feast packed with 20+ authentic Godavari items: Sona Masoori Rice, Pure Ghee, Kandi Podi, Gongura, Gutti Vankaya, Majjiga Pulusu, Perugu Garelu, Bobbatlu & more.'
  },
  {
    itemId: 'meal-single',
    name: 'Single Meals',
    telugu: 'సింగిల్ మీల్స్',
    category: 'butta',
    price: 195,
    originalPrice: 220,
    rating: 4.8,
    reviews: 1420,
    spiceLevel: 'medium',
    dietary: ['chef-special'],
    isBestseller: true,
    isSpecial: false,
    isVeg: true,
    preparationTime: '10-15 Mins',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    description: 'Full satisfying single-person Andhra bhojanam with rice, 2 curries, sambar, rasam, podi, ghee, curd, and papad.'
  },
  {
    itemId: 'meal-biriyani-half',
    name: 'Veg Biriyani Half',
    telugu: 'వెజ్ బిర్యానీ హాఫ్',
    category: 'rice',
    price: 155,
    originalPrice: 180,
    rating: 4.8,
    reviews: 1100,
    spiceLevel: 'spicy',
    dietary: ['chef-special'],
    isBestseller: true,
    isSpecial: false,
    isVeg: true,
    preparationTime: '15-20 Mins',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    description: 'Fragrant basmati rice slow-cooked with fresh country vegetables, aromatic whole spices, and rich herbs. Served with raita.'
  },
  {
    itemId: 'meal-pulihora-half',
    name: 'Pulihora Half',
    telugu: 'చింతపండు పులిహోర హాఫ్',
    category: 'rice',
    price: 100,
    rating: 4.9,
    reviews: 840,
    spiceLevel: 'medium',
    dietary: ['jain-available'],
    isBestseller: false,
    isVeg: true,
    preparationTime: '10 Mins',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    description: 'Traditional Godavari tamarind rice tossed with crunchy roasted peanuts, green chillies, curry leaves, and asafoetida.'
  },
  {
    itemId: 'meal-gongura-pulihora-half',
    name: 'Gongura Pulihora Half',
    telugu: 'గోంగూర పులిహోర హాఫ్',
    category: 'rice',
    price: 100,
    rating: 5.0,
    reviews: 970,
    spiceLevel: 'spicy',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '10 Mins',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    description: 'Tangy seasoned Gongura leaf spiced rice tempered with mustard, dry chillies, and roasted chana dal.'
  },
  {
    itemId: 'meal-sambar-rice-half',
    name: 'Sambar Rice Half',
    telugu: 'సాంబార్ రైస్ హాఫ్',
    category: 'rice',
    price: 100,
    rating: 4.9,
    reviews: 820,
    spiceLevel: 'medium',
    dietary: ['jain-available'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '10 Mins',
    image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?auto=format&fit=crop&w=800&q=80',
    description: 'Comforting hot rice mashed with rich Godavari drumstick sambar and finished with generous pure ghee tadka.'
  },
  {
    itemId: 'meal-curd-rice-half',
    name: 'Curd Rice Half',
    telugu: 'కమ్మటి పెరుగన్నం హాఫ్',
    category: 'rice',
    price: 100,
    rating: 4.9,
    reviews: 690,
    spiceLevel: 'mild',
    dietary: ['jain-available'],
    isBestseller: false,
    isVeg: true,
    preparationTime: '5-10 Mins',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    description: 'Cooling creamy fresh curd rice tempered with mustard seeds, ginger, curry leaves, and pomegranate arils.'
  },

  // --- GODAVARI CURRIES ---
  {
    itemId: 'curry-panasa-mukkala',
    name: 'Panasa Mukkala Curry',
    telugu: 'గోదావరి పనస ముక్కల కూర (Royal Jackfruit)',
    category: 'curries',
    price: 140,
    rating: 5.0,
    reviews: 1420,
    spiceLevel: 'spicy',
    dietary: ['chef-special'],
    isBestseller: true,
    isSpecial: true,
    isVeg: true,
    preparationTime: '15 Mins',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    description: 'The royal crown of Godavari festive vegetarian feasts! Tender raw jackfruit pieces simmered in rich mustard-poppy seed gravy.'
  },
  {
    itemId: 'curry-panner',
    name: 'Panner Curry',
    telugu: 'షాహీ పన్నీర్ కూర',
    category: 'curries',
    price: 140,
    rating: 4.9,
    reviews: 1150,
    spiceLevel: 'medium',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '15 Mins',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    description: 'Soft cottage cheese cubes cooked in rich tomato butter gravy infused with authentic Godavari spices.'
  },
  {
    itemId: 'curry-mashroom',
    name: 'Mashroom Curry',
    telugu: 'మష్రూమ్ మసాలా కూర',
    category: 'curries',
    price: 140,
    rating: 4.8,
    reviews: 820,
    spiceLevel: 'spicy',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '15 Mins',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    description: 'Juicy button mushrooms cooked in an aromatic roasted cashew and pepper coastal masala gravy.'
  },
  {
    itemId: 'curry-gutti-vankaya',
    name: 'Gutti Vankaya Curry',
    telugu: 'స్పెషల్ గుత్తి వంకాయ కూర',
    category: 'curries',
    price: 50,
    rating: 4.9,
    reviews: 1340,
    spiceLevel: 'spicy',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '10 Mins',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    description: 'Rich Godavari Gutti Vankaya stuffed brinjal gravy cooked with roasted peanut, sesame, and dry coconut masala.'
  },
  {
    itemId: 'curry-bendakay-pakodi',
    name: 'Bendakay Pakodi',
    telugu: 'బెండకాయ పకోడీ వేపుడు',
    category: 'curries',
    price: 40,
    rating: 4.9,
    reviews: 590,
    spiceLevel: 'medium',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '10 Mins',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    description: 'Thin sliced okra coated in spiced gram flour batter and fried till crunch-perfect with cashews.'
  },
  {
    itemId: 'meal-dahi-vada-2p',
    name: 'Dahi Vada (2 Pieces)',
    telugu: 'పెరుగు వడ (2 ముక్కలు)',
    category: 'curries',
    price: 50,
    rating: 4.9,
    reviews: 750,
    spiceLevel: 'mild',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '5 Mins',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    description: 'Two fluffy urad dal vadas thoroughly soaked in seasoned spiced curd with mustard tadka and boondi.'
  },

  // --- FAMOUS GODAVARI PICKLES ---
  {
    itemId: 'pickle-gongura',
    name: 'Gongura Pickle 250g',
    telugu: 'ఆంధ్రా గోంగూర పచ్చడి (250 గ్రా.)',
    category: 'pickles',
    price: 155,
    rating: 5.0,
    reviews: 2180,
    spiceLevel: 'spicy',
    dietary: ['chef-special'],
    isBestseller: true,
    isSpecial: true,
    isVeg: true,
    preparationTime: '5 Mins',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    description: 'The pride of Andhra Pradesh! Authentic tangy Gongura leaves simmered in wood-pressed gingelly oil, stone-ground with garlic, mustard seeds, and Guntur red chillies.'
  },
  {
    itemId: 'pickle-avakai',
    name: 'Avakai Pickle 250g',
    telugu: 'ఘుమఘుమలాడే ఆవకాయ పచ్చడి (250 గ్రా.)',
    category: 'pickles',
    price: 155,
    rating: 5.0,
    reviews: 1950,
    spiceLevel: 'spicy',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '5 Mins',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    description: 'Classic Godavari raw mango pickle prepared with stone-ground yellow mustard, pure sesame oil, and spicy red chillies.'
  },
  {
    itemId: 'pickle-allam',
    name: 'Allam Pickle 250g',
    telugu: 'అల్లం పచ్చడి (250 గ్రా.)',
    category: 'pickles',
    price: 155,
    rating: 4.9,
    reviews: 1120,
    spiceLevel: 'medium',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '5 Mins',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
    description: 'Traditional ginger pachadi sweetened gently with organic jaggery and tangy tamarind pulp. Famous Godavari accompaniment for pesarattu and rice.'
  },
  {
    itemId: 'pickle-pandu-mirapakai',
    name: 'Pandu Mirapakai Pickle 250g',
    telugu: 'పండు మిరపకాయ పచ్చడి (250 గ్రా.)',
    category: 'pickles',
    price: 155,
    rating: 4.9,
    reviews: 1040,
    spiceLevel: 'spicy',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '5 Mins',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    description: 'Vibrant red ripe chillies stone-crushed with garlic, tamarind, and mustard seeds. An authentic fiery Andhra specialty.'
  },

  // --- GODAVARI PODULU (SPICE POWDERS) ---
  {
    itemId: 'podi-kandi',
    name: 'Kandi Podi (Gunpowder) 250g',
    telugu: 'కంది పొడి (250 గ్రా.)',
    category: 'podulu',
    price: 155,
    rating: 5.0,
    reviews: 2450,
    spiceLevel: 'medium',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '5 Mins',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    description: 'The crown jewel of Subbayya Gari feast! Roasted toor dal, chana dal, cumin, and red chillies ground to golden perfection. Best enjoyed with hot steaming rice and melted pure ghee.'
  },
  {
    itemId: 'podi-karivepaku',
    name: 'Karivepaku Podi 250g',
    telugu: 'కరివేపాకు పొడి (250 గ్రా.)',
    category: 'podulu',
    price: 155,
    rating: 4.9,
    reviews: 1320,
    spiceLevel: 'medium',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '5 Mins',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    description: 'Fresh Godavari curry leaves slow-roasted and stone-powdered with lentils, cumin, and garlic. Packed with natural iron and digestive goodness.'
  },
  {
    itemId: 'podi-vellulli-karam',
    name: 'Vellulli Karam Podi 250g',
    telugu: 'వెల్లుల్లి కారం పొడి (250 గ్రా.)',
    category: 'podulu',
    price: 155,
    rating: 4.9,
    reviews: 1480,
    spiceLevel: 'spicy',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '5 Mins',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    description: 'Crushed roasted garlic cloves combined with spicy red chillies, cumin, and coriander seeds. Elevates idlis, dosas, and hot rice with warm ghee.'
  },

  // --- TRADITIONAL GODAVARI SWEETS ---
  {
    itemId: 'sweet-pootharekulu-bellam',
    name: 'Atreyapuram Bellam Pootharekulu (10 Pcs)',
    telugu: 'ఆత్రేయపురం బెల్లం పూతరేకులు (10 ముక్కలు)',
    category: 'sweets',
    price: 320,
    rating: 5.0,
    reviews: 3820,
    spiceLevel: 'mild',
    dietary: ['chef-special'],
    isBestseller: true,
    isSpecial: true,
    isVeg: true,
    preparationTime: '5 Mins',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    description: 'The world-famous Paper Sweet! Wafer-thin rice starch sheets rolled delicately with organic organic Godavari jaggery, dry fruits, and abundant pure ghee.'
  },
  {
    itemId: 'sweet-kakinada-kaja',
    name: 'Famous Kakinada Gottam Kaja (500g)',
    telugu: 'కాకినాడ గొట్టం కాజా (500 గ్రా.)',
    category: 'sweets',
    price: 260,
    rating: 5.0,
    reviews: 2940,
    spiceLevel: 'mild',
    dietary: ['chef-special'],
    isBestseller: true,
    isSpecial: true,
    isVeg: true,
    preparationTime: '5 Mins',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    description: 'Subbayya Gari hometown signature delicacy! Crispy cylindrical golden pastry soaked in aromatic cardamon sugar syrup, bursting with sweet juice in every bite.'
  },
  {
    itemId: 'sweet-bobbatlu',
    name: 'Nethi Bobbatlu / Puran Poli (5 Pcs)',
    telugu: 'తాజా నేతి బొబ్బట్లు (5 ముక్కలు)',
    category: 'sweets',
    price: 180,
    rating: 4.9,
    reviews: 1670,
    spiceLevel: 'mild',
    dietary: ['chef-special'],
    isBestseller: true,
    isVeg: true,
    preparationTime: '10 Mins',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    description: 'Soft melt-in-mouth flatbreads stuffed with sweetened chana dal, cardamom, and toasted on cast-iron tawa with rich pure ghee.'
  },
  {
    itemId: 'sweet-palathalikelu',
    name: 'Godavari Pala Thalikalu',
    telugu: 'కమ్మని పాల తాళికలు',
    category: 'sweets',
    price: 90,
    rating: 4.8,
    reviews: 840,
    spiceLevel: 'mild',
    dietary: [],
    isBestseller: false,
    isVeg: true,
    preparationTime: '10 Mins',
    image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?auto=format&fit=crop&w=800&q=80',
    description: 'Handcrafted rice noodles simmered in thick sweetened buffalo milk, flavored with organic jaggery syrup, cardamom, and roasted cashews.'
  }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/subbayya_gari_hotel';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('[Seed] Connected to MongoDB');
    }

    // 1. Seed Owner Account
    const ownerEmail = (process.env.OWNER_EMAIL || 'owner@subbayya.com').toLowerCase().trim();
    const ownerPassword = process.env.OWNER_PASSWORD || 'Subbayya@1950';
    const ownerName = process.env.OWNER_NAME || 'Subbayya Hotel Owner';
    const ownerPhone = process.env.OWNER_PHONE || '+91 90108 88842';

    let ownerUser = await User.findOne({ email: ownerEmail });
    if (!ownerUser) {
      const passwordHash = await User.hashPassword(ownerPassword);
      ownerUser = await User.create({
        name: ownerName,
        email: ownerEmail,
        phone: ownerPhone,
        passwordHash,
        role: 'owner',
        isActive: true,
      });
      console.log(`[Seed] ✅ Default Owner Account Created: ${ownerEmail} (Role: owner)`);
    } else {
      // Ensure role is owner
      if (ownerUser.role !== 'owner') {
        ownerUser.role = 'owner';
        await ownerUser.save();
      }
      console.log(`[Seed] Owner account already exists: ${ownerEmail}`);
    }

    // 2. Seed Default Store Settings
    let settings = await Setting.findOne({ key: 'global_settings' });
    if (!settings) {
      settings = await Setting.create({
        key: 'global_settings',
        restaurantName: 'Subbayya Gari Hotel',
        tagline: 'Authentic Andhra Pure Veg Butta Bhojanam Since 1950',
        phone: '+91 90108 88842',
        email: 'contact@subbayyagarihotel.com',
        address: 'MIG 295, Rd No. 4, KPHB Colony, Kukatpally, Hyderabad, Telangana 500072',
        openingTime: '11:00 AM',
        closingTime: '11:00 PM',
        isOpen: true,
        deliveryFeeBase: 30,
        deliveryFeePerKm: 10,
        packagingFee: 30,
        taxPercent: 5,
        currency: '₹',
        upiId: 'subbayyahotel@icici',
        upiPayeeName: 'Subbayya Gari Hotel KPHB',
      });
      console.log('[Seed] ✅ Default Store Settings initialized');
    }

    // 3. Seed Menu Items
    const count = await MenuItem.countDocuments();
    if (count === 0) {
      console.log(`[Seed] Seeding ${DEFAULT_MENU_ITEMS.length} authentic Subbayya Gari menu items...`);
      await MenuItem.insertMany(DEFAULT_MENU_ITEMS);
      console.log('[Seed] ✅ Menu items successfully seeded into MongoDB');
    } else {
      console.log(`[Seed] Database already contains ${count} menu items`);
    }

    // 4. Initialize Order Counter
    let counter = await Counter.findOne({ id: 'order_number' });
    if (!counter) {
      await Counter.create({ id: 'order_number', seq: 10000 });
      console.log('[Seed] ✅ Order counter initialized at 10000');
    }

    console.log('[Seed] Database initialization complete!');
    return true;
  } catch (error) {
    console.error('[Seed Error]:', error);
    return false;
  }
};

// Allow direct CLI execution
if (require.main === module) {
  seedDatabase().then(() => {
    mongoose.disconnect();
    process.exit(0);
  });
}

module.exports = seedDatabase;
