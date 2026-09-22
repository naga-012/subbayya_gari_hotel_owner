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
  },
  // --- RICE (ADDITIONAL) ---
  { itemId: 'meal-special-rice-half', name: 'Special Rice Half', telugu: 'స్పెషల్ రైస్', category: 'rice', price: 80, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', description: 'Flavorful special rice preparation - Authentic Subbayya Gari Hotel recipe' },
  { itemId: 'meal-extra-rice', name: 'Extra Rice', telugu: 'అదనపు రైస్', category: 'rice', price: 30, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', description: 'Extra serving of steamed rice' },
  // --- CURRIES (MEAL SIDES) ---
  { itemId: 'meal-pappu', name: 'Pappu', telugu: 'పప్పు', category: 'curries', price: 40, spiceLevel: 'medium', isVeg: true, isBestseller: true, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', description: 'Traditional Telugu dal - Subbayya Gari style' },
  { itemId: 'meal-sambar', name: 'Sambar', telugu: 'సాంబార్', category: 'curries', price: 40, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80', description: 'Authentic South Indian sambar with vegetables' },
  { itemId: 'meal-rasam', name: 'Rasam', telugu: 'రసం', category: 'curries', price: 30, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', description: 'Tangy and spiced traditional rasam' },
  { itemId: 'meal-veg-curry', name: 'Veg Curry', telugu: 'వెజ్ కర్రీ', category: 'curries', price: 60, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Mixed vegetable curry - Subbayya Gari Hotel style' },
  { itemId: 'meal-veg-fry', name: 'Veg Fry', telugu: 'వెజ్ ఫ్రై', category: 'curries', price: 60, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Crispy fried vegetables with spices' },
  { itemId: 'meal-curd', name: 'Curd', telugu: 'పెరుగు', category: 'curries', price: 30, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80', description: 'Fresh homemade curd' },
  { itemId: 'meal-roti-pacchadi', name: 'Roti Pacchadi', telugu: 'రోటి పచ్చడి', category: 'curries', price: 40, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', description: 'Traditional stone-ground chutney' },
  { itemId: 'meal-majjiga-pulusu', name: 'Majjiga Pulusu', telugu: 'మజ్జిగ పులుసు', category: 'curries', price: 40, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', description: 'Tangy buttermilk based curry' },
  { itemId: 'meal-pacchi-pulusu', name: 'Pacchi Pulusu', telugu: 'పచ్చి పులుసు', category: 'curries', price: 40, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', description: 'Raw tamarind based pulusu - Authentic Telugu style' },
  { itemId: 'meal-special-veg-curry', name: 'Special Veg Curry', telugu: 'స్పెషల్ వెజ్ కర్రీ', category: 'curries', price: 80, spiceLevel: 'medium', isVeg: true, isBestseller: true, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Chef special vegetable curry preparation' },
  { itemId: 'meal-dahi-vada-3p', name: 'Dahi Vada 3P', telugu: 'దహి వడ 3పీస్', category: 'curries', price: 70, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', description: 'Soft vadas soaked in fresh yogurt - 3 pieces' },
  // --- CURRIES (SPECIFIC) ---
  { itemId: 'curry-mirchi-masala', name: 'Mirchi Masala Curry', telugu: 'మిర్చి మసాలా కర్రీ', category: 'curries', price: 80, spiceLevel: 'hot', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Spicy mirchi masala - Subbayya Gari style' },
  { itemId: 'curry-vankay-batany', name: 'Vankay Batany Curry', telugu: 'వంకాయ బటానీ కర్రీ', category: 'curries', price: 80, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Brinjal and green peas curry' },
  { itemId: 'curry-capsicum-mealmaker', name: 'Capsicum Mealmaker', telugu: 'క్యాప్సికం మీల్‌మేకర్', category: 'curries', price: 90, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Capsicum and soya chunks curry' },
  { itemId: 'curry-tamota', name: 'Tamota Curry', telugu: 'టమాటా కర్రీ', category: 'curries', price: 60, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', description: 'Tangy tomato based curry' },
  { itemId: 'curry-kakarakay-fry', name: 'Kakarakay Fry', telugu: 'కాకరకాయ ఫ్రై', category: 'curries', price: 70, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Crispy bitter gourd fry' },
  { itemId: 'curry-cabbage', name: 'Cabbage', telugu: 'క్యాబేజ్', category: 'curries', price: 60, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Stir-fried cabbage with spices' },
  { itemId: 'curry-alu-fry', name: 'Alu Fry', telugu: 'ఆలూ ఫ్రై', category: 'curries', price: 70, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Crispy spiced potato fry' },
  { itemId: 'curry-chikkudukay', name: 'Chikkudukay Curry', telugu: 'చిక్కుడుకాయ కర్రీ', category: 'curries', price: 80, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Country beans curry - traditional style' },
  { itemId: 'curry-alu-curry', name: 'Alu Curry', telugu: 'ఆలూ కర్రీ', category: 'curries', price: 70, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Classic potato curry' },
  { itemId: 'curry-mullakada', name: 'Mullakada Curry', telugu: 'మూలంకడ కర్రీ', category: 'curries', price: 70, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Drumstick curry - Subbayya Gari style' },
  { itemId: 'curry-dondakay', name: 'Dondakay Curry', telugu: 'దొండకాయ కర్రీ', category: 'curries', price: 70, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Ivy gourd curry' },
  { itemId: 'curry-gobi', name: 'Gobi Curry', telugu: 'గోబీ కర్రీ', category: 'curries', price: 80, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Cauliflower curry with spices' },
  { itemId: 'curry-dondakay-fry', name: 'Dondakay Fry', telugu: 'దొండకాయ ఫ్రై', category: 'curries', price: 70, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Crispy ivy gourd fry' },
  { itemId: 'curry-bendakay', name: 'Bendakay Curry', telugu: 'బెండకాయ కర్రీ', category: 'curries', price: 70, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Ladies finger curry' },
  { itemId: 'curry-aratikaya', name: 'Aratikaya Curry', telugu: 'అరటికాయ కర్రీ', category: 'curries', price: 70, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Raw banana curry - Traditional Telugu recipe' },
  { itemId: 'curry-bheerakaya', name: 'Bheerakaya', telugu: 'బీరకాయ', category: 'curries', price: 60, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Ridge gourd preparation' },
  { itemId: 'curry-vankay-pakodi', name: 'Vankay Pakodi', telugu: 'వంకాయ పకోడీ', category: 'curries', price: 80, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Crispy brinjal pakoda' },
  { itemId: 'curry-gotti-vankay', name: 'Gotti Vankay', telugu: 'గొట్టి వంకాయ', category: 'curries', price: 90, spiceLevel: 'medium', isVeg: true, isBestseller: true, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Stuffed brinjal curry - Subbayya special' },
  { itemId: 'curry-punugula', name: 'Punugula Curry', telugu: 'పునుగులు', category: 'curries', price: 70, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Traditional punugulu with curry' },
  { itemId: 'curry-kanda', name: 'Kanda Curry', telugu: 'కంద కర్రీ', category: 'curries', price: 80, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Yam curry - Traditional Andhra style' },
  { itemId: 'curry-dondakay-pakodi', name: 'Dondakay Pakodi', telugu: 'దొండకాయ పకోడీ', category: 'curries', price: 80, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Crispy ivy gourd pakoda' },
  { itemId: 'curry-gongura-makarani', name: 'Gongura Makarani', telugu: 'గోంగూర మాకరాణీ', category: 'curries', price: 90, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', description: 'Sorrel leaves pasta - Subbayya special' },
  { itemId: 'curry-curd-daily', name: 'Curd (Daily Fresh)', telugu: 'పెరుగు (రోజువారీ)', category: 'curries', price: 30, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80', description: 'Daily fresh curd' },
  { itemId: 'curry-majjiga-pulusu-daily', name: 'Majjiga Pulusu (Daily)', telugu: 'మజ్జిగ పులుసు (రోజువారీ)', category: 'curries', price: 40, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', description: 'Daily special majjiga pulusu' },
  { itemId: 'curry-rasam-daily', name: 'Rasam (Daily Special)', telugu: 'రసం (రోజువారీ)', category: 'curries', price: 30, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', description: 'Daily special rasam' },
  { itemId: 'curry-sambar-daily', name: 'Sambar (Daily Special)', telugu: 'సాంబార్ (రోజువారీ)', category: 'curries', price: 40, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10-15 Mins', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', description: 'Daily special sambar' },
  // --- APPADALU ---
  { itemId: 'appadalu-pesara', name: 'Pesara Appadalu', telugu: 'పెసర అప్పడాలు', category: 'other', price: 40, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', description: 'Crispy green moong dal appadams' },
  { itemId: 'appadalu-karam', name: 'Karam Appadalu', telugu: 'కారం అప్పడాలు', category: 'other', price: 40, spiceLevel: 'spicy', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', description: 'Spicy fried appadams' },
  { itemId: 'appadalu-nuvvula', name: 'Nuvvula Appadalu', telugu: 'నువ్వుల అప్పడాలు', category: 'other', price: 40, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', description: 'Sesame seed appadams' },
  { itemId: 'appadalu-kandi', name: 'Kandi Appadalu', telugu: 'కంది అప్పడాలు', category: 'other', price: 40, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', description: 'Toor dal appadams' },
  // --- PODULU (ADDITIONAL) ---
  { itemId: 'podi-kandhi', name: 'Kandhi podi 100g', telugu: 'కంధి పొడి', category: 'podulu', price: 60, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', description: 'Traditional kandi podi - 100g pack' },
  { itemId: 'podi-kobbari', name: 'Kobbari Karam 100g', telugu: 'కొబ్బరి కారం', category: 'podulu', price: 60, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', description: 'Coconut spice powder - 100g' },
  { itemId: 'podi-nalla', name: 'Nalla Karam 100g', telugu: 'నల్ల కారం', category: 'podulu', price: 60, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', description: 'Black spice powder - 100g' },
  { itemId: 'podi-palli', name: 'Palli Karam 100g', telugu: 'పల్లీ కారం', category: 'podulu', price: 60, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', description: 'Groundnut spice powder - 100g' },
  { itemId: 'podi-ulava', name: 'Ulava Karam 100g', telugu: 'ఉలవ కారం', category: 'podulu', price: 65, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', description: 'Horse gram spice powder - 100g' },
  { itemId: 'podi-dhaniya', name: 'Dhaniya Karam 100g', telugu: 'ధనియ కారం', category: 'podulu', price: 60, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', description: 'Coriander spice powder - 100g' },
  { itemId: 'podi-idly', name: 'Idly Karam 100g', telugu: 'ఇడ్లీ కారం', category: 'podulu', price: 55, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', description: 'Idly spice powder - 100g' },
  { itemId: 'podi-nalla-garlic', name: 'Vellulli Nalla Karam 100g', telugu: 'వెల్లుల్లి నల్ల కారం', category: 'podulu', price: 70, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', description: 'Garlic black spice powder - 100g' },
  { itemId: 'podi-sambar', name: 'Sambar Karam 100g', telugu: 'సాంబార్ కారం', category: 'podulu', price: 60, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', description: 'Sambar spice powder - 100g' },
  { itemId: 'podi-mulagaku', name: 'Mulagaku Karam 100g', telugu: 'ములగాకు కారం', category: 'podulu', price: 65, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', description: 'Drumstick leaf spice powder - 100g' },
  { itemId: 'podi-04', name: 'Subbayya Pure Buffalo Ghee (500ml Jar)', telugu: 'సుబ్బయ్య స్వచ్ఛమైన గేదె నెయ్యి', category: 'podulu', price: 450, spiceLevel: 'mild', isVeg: true, isBestseller: true, isSpecial: true, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1608500218890-81d8a3b2a4a2?auto=format&fit=crop&w=800&q=80', description: 'Pure traditional buffalo ghee in 500ml jar' },
  // --- PICKLES (ADDITIONAL) ---
  { itemId: 'pickle-mango', name: 'Mango Pickle 250g', telugu: 'మామిడి పచ్చడి', category: 'pickles', price: 100, spiceLevel: 'spicy', isVeg: true, isBestseller: true, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', description: 'Traditional Andhra mango pickle - 250g' },
  { itemId: 'pickle-gongura-pandu-mirchi', name: 'Gongura Pandu Mirchi Pickle 250g', telugu: 'గోంగూర పండు మిరపకాయ పచ్చడి', category: 'pickles', price: 110, spiceLevel: 'spicy', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', description: 'Sorrel leaves with red chilli pickle - 250g' },
  { itemId: 'pickle-lemon', name: 'Lemon Pickle 250g', telugu: 'నిమ్మ పచ్చడి', category: 'pickles', price: 90, spiceLevel: 'spicy', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', description: 'Tangy lemon pickle - 250g' },
  { itemId: 'pickle-vankaya', name: 'Vankaya Pickle 250g', telugu: 'వంకాయ పచ్చడి', category: 'pickles', price: 100, spiceLevel: 'spicy', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', description: 'Brinjal pickle - 250g' },
  { itemId: 'pickle-usirikaya', name: 'Usirikaya Pickle 250g', telugu: 'ఉసిరికాయ పచ్చడి', category: 'pickles', price: 100, spiceLevel: 'spicy', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', description: 'Gooseberry pickle - 250g' },
  { itemId: 'pickle-maagaya', name: 'Maagaya Pickle 250g', telugu: 'మాగాయ పచ్చడి', category: 'pickles', price: 110, spiceLevel: 'spicy', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', description: 'Raw mango pickle - 250g' },
  { itemId: 'pickle-tamota', name: 'Tamota Pickle 250g', telugu: 'టమాటా పచ్చడి', category: 'pickles', price: 90, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', description: 'Tomato pickle - 250g' },
  { itemId: 'pickle-kakarakaya', name: 'Kakarakaya Pickle 250g', telugu: 'కాకరకాయ పచ్చడి', category: 'pickles', price: 100, spiceLevel: 'spicy', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', description: 'Bitter gourd pickle - 250g' },
  { itemId: 'pickle-bellam-avakaya', name: 'Bellam Avakaya Pickle 250g', telugu: 'బెల్లం అవకాయ పచ్చడి', category: 'pickles', price: 110, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', description: 'Sweet raw mango pickle with jaggery - 250g' },
  { itemId: 'pickle-chinthakaya', name: 'Chinthakaya Pickle 250g', telugu: 'చింతకాయ పచ్చడి', category: 'pickles', price: 100, spiceLevel: 'spicy', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', description: 'Tamarind pickle - 250g' },
  { itemId: 'pickle-califlower', name: 'Califlower Pickle 250g', telugu: 'కాలీఫ్లవర్ పచ్చడి', category: 'pickles', price: 100, spiceLevel: 'medium', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '5 Mins', image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', description: 'Cauliflower pickle - 250g' },
  // --- SWEETS (ADDITIONAL) ---
  { itemId: 'sweet-boori', name: 'Boori 5pcs', telugu: 'బూరి', category: 'sweets', price: 80, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10 Mins', image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', description: 'Traditional deep fried sweet - 5 pieces' },
  { itemId: 'sweet-bobbattu', name: 'Bobbattu 5pcs', telugu: 'బొబ్బట్టు', category: 'sweets', price: 100, spiceLevel: 'mild', isVeg: true, isBestseller: true, isSpecial: false, preparationTime: '10 Mins', image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', description: 'Sweet lentil flatbread - 5 pieces' },
  { itemId: 'sweet-malaipoori', name: 'Malaipoori 5pcs', telugu: 'మలై పూరీ', category: 'sweets', price: 90, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10 Mins', image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', description: 'Cream puri sweet - 5 pieces' },
  { itemId: 'sweet-madatha-kaja', name: 'Madatha Kaja 250Gr', telugu: 'మడతకాజా', category: 'sweets', price: 120, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10 Mins', image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', description: 'Famous Madatha Kaja sweet - 250g' },
  { itemId: 'sweet-badhusha', name: 'Badhusha 250Gr', telugu: 'బాదుషా', category: 'sweets', price: 120, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10 Mins', image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', description: 'Traditional Badhusha sweet - 250g' },
  { itemId: 'sweet-boondhi-laddu', name: 'Boondhi Laddu 250Gr', telugu: 'బూంది లడ్డు', category: 'sweets', price: 130, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10 Mins', image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', description: 'Traditional boondi laddu - 250g' },
  { itemId: 'sweet-jangri', name: '65 Jangri 250g', telugu: '65 జంగ్రీ', category: 'sweets', price: 120, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10 Mins', image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', description: 'Famous 65 Jangri sweet - 250g' },
  { itemId: 'sweet-02', name: 'Authentic Atreyapuram Pootharekulu (Box of 5)', telugu: 'అత్రేయపురం పూతరేకులు', category: 'sweets', price: 200, spiceLevel: 'mild', isVeg: true, isBestseller: true, isSpecial: true, preparationTime: '10 Mins', image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', description: 'Authentic Atreyapuram Pootharekulu - Box of 5 pieces' },
  { itemId: 'sweet-04', name: 'Bellam Jalebi (Hot & Crispy 250g)', telugu: 'బెల్లం జిలేబీ', category: 'sweets', price: 100, spiceLevel: 'mild', isVeg: true, isBestseller: false, isSpecial: false, preparationTime: '10 Mins', image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', description: 'Hot and crispy bellam jalebi - 250g' }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/subbayya_gari_hotel';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('[Seed] Connected to MongoDB');
    }

    // 1. Seed Owner Account
    const primaryOwnerEmail = (process.env.OWNER_EMAIL || 'myakalanagarjun09@gmail.com').toLowerCase().trim();
    const ownerPassword = process.env.OWNER_PASSWORD || '123456';
    const ownerName = process.env.OWNER_NAME || 'G. Subbayya';
    const ownerPhone = process.env.OWNER_PHONE || '9121792433';

    // List of owner emails to ensure exist and have active password
    const emailsToEnsure = Array.from(new Set([
      primaryOwnerEmail,
      'myakalanagarjun09@gmail.com',
      'myakallanagarjun09@gmail.com',
      'owner@subbayya.com'
    ]));

    const passwordHash = await User.hashPassword(ownerPassword);

    for (const email of emailsToEnsure) {
      let ownerUser = await User.findOne({ email });
      if (!ownerUser) {
        ownerUser = await User.create({
          name: ownerName,
          email,
          phone: ownerPhone,
          passwordHash,
          role: 'owner',
          isActive: true,
        });
        console.log(`[Seed] ✅ Owner Account Created: ${email} (Password: ${ownerPassword})`);
      } else {
        ownerUser.role = 'owner';
        ownerUser.isActive = true;
        ownerUser.passwordHash = passwordHash;
        await ownerUser.save();
        console.log(`[Seed] ✅ Owner Account Updated: ${email} (Password refreshed)`);
      }
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

    // 3. Seed Menu Items — upsert every item so new ones are always added
    console.log(`[Seed] Checking ${DEFAULT_MENU_ITEMS.length} menu items...`);
    let seededCount = 0;
    for (const item of DEFAULT_MENU_ITEMS) {
      try {
        const exists = await MenuItem.findOne({ itemId: item.itemId });
        if (!exists) {
          await MenuItem.create(item);
          seededCount++;
        }
      } catch (e) {
        if (e.code !== 11000) console.error('[Seed] Item error:', item.itemId, e.message);
      }
    }
    // Fix category mismatch: podolu -> podulu
    await MenuItem.updateMany({ category: 'podolu' }, { $set: { category: 'podulu' } });
    const totalNow = await MenuItem.countDocuments();
    console.log(`[Seed] ✅ Added ${seededCount} new items. Total in DB: ${totalNow}`);

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
