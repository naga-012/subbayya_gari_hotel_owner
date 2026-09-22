/**
 * Script to add all missing menu items (from customer site) into the Owner Portal MongoDB.
 * Run with: node server/utils/add_missing_menu.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/subbayya_hotel';

// Schema (mirrors server/models/MenuItem.js)
const menuItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  telugu: { type: String, default: '' },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: null },
  image: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  isVeg: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },
  isSpecial: { type: Boolean, default: false },
  preparationTime: { type: String, default: '10-15 Mins' },
  spiceLevel: { type: String, default: 'medium' },
  dietary: { type: [String], default: [] },
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// ---- All missing items from customer site ----
const MISSING_ITEMS = [
  // Rice
  { itemId: 'meal-special-rice-half', name: 'Special Rice Half', telugu: 'స్పెషల్ రైస్', description: 'Flavorful special rice preparation - Authentic Subbayya Gari Hotel recipe', category: 'rice', price: 80, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'meal-extra-rice', name: 'Extra Rice', telugu: 'అదనపు రైస్', description: 'Extra serving of steamed rice', category: 'rice', price: 30, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', isBestseller: false },

  // Curries (meal sides)
  { itemId: 'meal-pappu', name: 'Pappu', telugu: 'పప్పు', description: 'Traditional Telugu dal - Subbayya Gari style', category: 'curries', price: 40, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', isBestseller: true },
  { itemId: 'meal-sambar', name: 'Sambar', telugu: 'సాంబార్', description: 'Authentic South Indian sambar with vegetables', category: 'curries', price: 40, image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'meal-rasam', name: 'Rasam', telugu: 'రసం', description: 'Tangy and spiced traditional rasam', category: 'curries', price: 30, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'meal-veg-curry', name: 'Veg Curry', telugu: 'వెజ్ కర్రీ', description: 'Mixed vegetable curry - Subbayya Gari Hotel style', category: 'curries', price: 60, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'meal-veg-fry', name: 'Veg Fry', telugu: 'వెజ్ ఫ్రై', description: 'Crispy fried vegetables with spices', category: 'curries', price: 60, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'meal-curd', name: 'Curd', telugu: 'పెరుగు', description: 'Fresh homemade curd', category: 'curries', price: 30, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'meal-roti-pacchadi', name: 'Roti Pacchadi', telugu: 'రోటి పచ్చడి', description: 'Traditional stone-ground chutney', category: 'curries', price: 40, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'meal-majjiga-pulusu', name: 'Majjiga Pulusu', telugu: 'మజ్జిగ పులుసు', description: 'Tangy buttermilk based curry', category: 'curries', price: 40, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'meal-pacchi-pulusu', name: 'Pacchi Pulusu', telugu: 'పచ్చి పులుసు', description: 'Raw tamarind based pulusu - Authentic Telugu style', category: 'curries', price: 40, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'meal-special-veg-curry', name: 'Special Veg Curry', telugu: 'స్పెషల్ వెజ్ కర్రీ', description: 'Chef special vegetable curry preparation', category: 'curries', price: 80, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: true },
  { itemId: 'meal-dahi-vada-3p', name: 'Dahi Vada 3P', telugu: 'దహి వడ 3పీస్', description: 'Soft vadas soaked in fresh yogurt - 3 pieces', category: 'curries', price: 70, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', isBestseller: false },

  // Curries (specific curry items)
  { itemId: 'curry-mirchi-masala', name: 'Mirchi Masala Curry', telugu: 'మిర్చి మసాలా కర్రీ', description: 'Spicy mirchi masala - Subbayya Gari style', category: 'curries', price: 80, spiceLevel: 'hot', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-vankay-batany', name: 'Vankay Batany Curry', telugu: 'వంకాయ బటానీ కర్రీ', description: 'Brinjal and green peas curry', category: 'curries', price: 80, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-capsicum-mealmaker', name: 'Capsicum Mealmaker', telugu: 'క్యాప్సికం మీల్‌మేకర్', description: 'Capsicum and soya chunks curry', category: 'curries', price: 90, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-tamota', name: 'Tamota Curry', telugu: 'టమాటా కర్రీ', description: 'Tangy tomato based curry', category: 'curries', price: 60, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-kakarakay-fry', name: 'Kakarakay Fry', telugu: 'కాకరకాయ ఫ్రై', description: 'Crispy bitter gourd fry', category: 'curries', price: 70, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-cabbage', name: 'Cabbage', telugu: 'క్యాబేజ్', description: 'Stir-fried cabbage with spices', category: 'curries', price: 60, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-alu-fry', name: 'Alu Fry', telugu: 'ఆలూ ఫ్రై', description: 'Crispy spiced potato fry', category: 'curries', price: 70, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-chikkudukay', name: 'Chikkudukay Curry', telugu: 'చిక్కుడుకాయ కర్రీ', description: 'Country beans curry - traditional style', category: 'curries', price: 80, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-alu-curry', name: 'Alu Curry', telugu: 'ఆలూ కర్రీ', description: 'Classic potato curry', category: 'curries', price: 70, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-mullakada', name: 'Mullakada Curry', telugu: 'మూలంకడ కర్రీ', description: 'Drumstick curry - Subbayya Gari style', category: 'curries', price: 70, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-dondakay', name: 'Dondakay Curry', telugu: 'దొండకాయ కర్రీ', description: 'Ivy gourd curry', category: 'curries', price: 70, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-gobi', name: 'Gobi Curry', telugu: 'గోబీ కర్రీ', description: 'Cauliflower curry with spices', category: 'curries', price: 80, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-dondakay-fry', name: 'Dondakay Fry', telugu: 'దొండకాయ ఫ్రై', description: 'Crispy ivy gourd fry', category: 'curries', price: 70, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-bendakay', name: 'Bendakay Curry', telugu: 'బెండకాయ కర్రీ', description: 'Ladies finger curry', category: 'curries', price: 70, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-aratikaya', name: 'Aratikaya Curry', telugu: 'అరటికాయ కర్రీ', description: 'Raw banana curry - Traditional Telugu recipe', category: 'curries', price: 70, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-bheerakaya', name: 'Bheerakaya', telugu: 'బీరకాయ', description: 'Ridge gourd preparation', category: 'curries', price: 60, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-vankay-pakodi', name: 'Vankay Pakodi', telugu: 'వంకాయ పకోడీ', description: 'Crispy brinjal pakoda', category: 'curries', price: 80, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-gotti-vankay', name: 'Gotti Vankay', telugu: 'గొట్టి వంకాయ', description: 'Stuffed brinjal curry - Subbayya special', category: 'curries', price: 90, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: true },
  { itemId: 'curry-punugula', name: 'Punugula Curry', telugu: 'పునుగులు', description: 'Traditional punugulu with curry', category: 'curries', price: 70, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-kanda', name: 'Kanda Curry', telugu: 'కంద కర్రీ', description: 'Yam curry - Traditional Andhra style', category: 'curries', price: 80, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-dondakay-pakodi', name: 'Dondakay Pakodi', telugu: 'దొండకాయ పకోడీ', description: 'Crispy ivy gourd pakoda', category: 'curries', price: 80, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-gongura-makarani', name: 'Gongura Makarani', telugu: 'గోంగూర మాకరాణీ', description: 'Sorrel leaves pasta - Subbayya special', category: 'curries', price: 90, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-curd-daily', name: 'Curd (Daily Fresh)', telugu: 'పెరుగు (రోజువారీ)', description: 'Daily fresh curd', category: 'curries', price: 30, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-majjiga-pulusu-daily', name: 'Majjiga Pulusu (Daily)', telugu: 'మజ్జిగ పులుసు (రోజువారీ)', description: 'Daily special majjiga pulusu', category: 'curries', price: 40, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-rasam-daily', name: 'Rasam (Daily Special)', telugu: 'రసం (రోజువారీ)', description: 'Daily special rasam', category: 'curries', price: 30, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'curry-sambar-daily', name: 'Sambar (Daily Special)', telugu: 'సాంబార్ (రోజువారీ)', description: 'Daily special sambar', category: 'curries', price: 40, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', isBestseller: false },

  // Appadalu
  { itemId: 'appadalu-pesara', name: 'Pesara Appadalu', telugu: 'పెసర అప్పడాలు', description: 'Crispy green moong dal appadams', category: 'other', price: 40, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'appadalu-karam', name: 'Karam Appadalu', telugu: 'కారం అప్పడాలు', description: 'Spicy fried appadams', category: 'other', price: 40, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'appadalu-nuvvula', name: 'Nuvvula Appadalu', telugu: 'నువ్వుల అప్పడాలు', description: 'Sesame seed appadams', category: 'other', price: 40, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'appadalu-kandi', name: 'Kandi Appadalu', telugu: 'కంది అప్పడాలు', description: 'Toor dal appadams', category: 'other', price: 40, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', isBestseller: false },

  // Podis
  { itemId: 'podi-kandhi', name: 'Kandhi podi 100g', telugu: 'కంధి పొడి', description: 'Traditional kandi podi - 100g pack', category: 'podolu', price: 60, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'podi-kobbari', name: 'Kobbari Karam 100g', telugu: 'కొబ్బరి కారం', description: 'Coconut spice powder - 100g', category: 'podolu', price: 60, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'podi-nalla', name: 'Nalla Karam 100g', telugu: 'నల్ల కారం', description: 'Black spice powder - 100g', category: 'podolu', price: 60, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'podi-palli', name: 'Palli Karam 100g', telugu: 'పల్లీ కారం', description: 'Groundnut spice powder - 100g', category: 'podolu', price: 60, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'podi-ulava', name: 'Ulava Karam 100g', telugu: 'ఉలవ కారం', description: 'Horse gram spice powder - 100g', category: 'podolu', price: 65, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'podi-dhaniya', name: 'Dhaniya Karam 100g', telugu: 'ధనియ కారం', description: 'Coriander spice powder - 100g', category: 'podolu', price: 60, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'podi-idly', name: 'Idly Karam 100g', telugu: 'ఇడ్లీ కారం', description: 'Idly spice powder - 100g', category: 'podolu', price: 55, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'podi-nalla-garlic', name: 'Vellulli Nalla Karam 100g', telugu: 'వెల్లుల్లి నల్ల కారం', description: 'Garlic black spice powder - 100g', category: 'podolu', price: 70, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'podi-sambar', name: 'Sambar Karam 100g', telugu: 'సాంబార్ కారం', description: 'Sambar spice powder - 100g', category: 'podolu', price: 60, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'podi-mulagaku', name: 'Mulagaku Karam 100g', telugu: 'ములగాకు కారం', description: 'Drumstick leaf spice powder - 100g', category: 'podolu', price: 65, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'podi-04', name: 'Subbayya Pure Buffalo Ghee (500ml Jar)', telugu: 'సుబ్బయ్య స్వచ్ఛమైన గేదె నెయ్యి', description: 'Pure traditional buffalo ghee in 500ml jar', category: 'podolu', price: 450, image: 'https://images.unsplash.com/photo-1608500218890-81d8a3b2a4a2?auto=format&fit=crop&w=800&q=80', isBestseller: true, isSpecial: true },

  // Pickles
  { itemId: 'pickle-mango', name: 'Mango Pickle 250g', telugu: 'మామిడి పచ్చడి', description: 'Traditional Andhra mango pickle - 250g', category: 'pickles', price: 100, image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', isBestseller: true },
  { itemId: 'pickle-gongura-pandu-mirchi', name: 'Gongura Pandu Mirchi Pickle 250g', telugu: 'గోంగూర పండు మిరపకాయ పచ్చడి', description: 'Sorrel leaves with red chilli pickle - 250g', category: 'pickles', price: 110, image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'pickle-lemon', name: 'Lemon Pickle 250g', telugu: 'నిమ్మ పచ్చడి', description: 'Tangy lemon pickle - 250g', category: 'pickles', price: 90, image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'pickle-vankaya', name: 'Vankaya Pickle 250g', telugu: 'వంకాయ పచ్చడి', description: 'Brinjal pickle - 250g', category: 'pickles', price: 100, image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'pickle-usirikaya', name: 'Usirikaya Pickle 250g', telugu: 'ఉసిరికాయ పచ్చడి', description: 'Gooseberry pickle - 250g', category: 'pickles', price: 100, image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'pickle-maagaya', name: 'Maagaya Pickle 250g', telugu: 'మాగాయ పచ్చడి', description: 'Raw mango pickle - 250g', category: 'pickles', price: 110, image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'pickle-tamota', name: 'Tamota Pickle 250g', telugu: 'టమాటా పచ్చడి', description: 'Tomato pickle - 250g', category: 'pickles', price: 90, image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'pickle-kakarakaya', name: 'Kakarakaya Pickle 250g', telugu: 'కాకరకాయ పచ్చడి', description: 'Bitter gourd pickle - 250g', category: 'pickles', price: 100, image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'pickle-bellam-avakaya', name: 'Bellam Avakaya Pickle 250g', telugu: 'బెల్లం అవకాయ పచ్చడి', description: 'Sweet raw mango pickle with jaggery - 250g', category: 'pickles', price: 110, image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'pickle-chinthakaya', name: 'Chinthakaya Pickle 250g', telugu: 'చింతకాయ పచ్చడి', description: 'Tamarind pickle - 250g', category: 'pickles', price: 100, image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'pickle-califlower', name: 'Califlower Pickle 250g', telugu: 'కాలీఫ్లవర్ పచ్చడి', description: 'Cauliflower pickle - 250g', category: 'pickles', price: 100, image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=800&q=80', isBestseller: false },

  // Sweets
  { itemId: 'sweet-boori', name: 'Boori 5pcs', telugu: 'బూరి', description: 'Traditional deep fried sweet - 5 pieces', category: 'sweets', price: 80, image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'sweet-bobbattu', name: 'Bobbattu 5pcs', telugu: 'బొబ్బట్టు', description: 'Sweet lentil flatbread - 5 pieces', category: 'sweets', price: 100, image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', isBestseller: true },
  { itemId: 'sweet-malaipoori', name: 'Malaipoori 5pcs', telugu: 'మలై పూరీ', description: 'Cream puri sweet - 5 pieces', category: 'sweets', price: 90, image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'sweet-madatha-kaja', name: 'Madatha Kaja 250Gr', telugu: 'మడతకాజా', description: 'Famous Madatha Kaja sweet - 250g', category: 'sweets', price: 120, image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'sweet-badhusha', name: 'Badhusha 250Gr', telugu: 'బాదుషా', description: 'Traditional Badhusha sweet - 250g', category: 'sweets', price: 120, image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'sweet-boondhi-laddu', name: 'Boondhi Laddu 250Gr', telugu: 'బూంది లడ్డు', description: 'Traditional boondi laddu - 250g', category: 'sweets', price: 130, image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'sweet-jangri', name: '65 Jangri 250g', telugu: '65 జంగ్రీ', description: 'Famous 65 Jangri sweet - 250g', category: 'sweets', price: 120, image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', isBestseller: false },
  { itemId: 'sweet-02', name: 'Authentic Atreyapuram Pootharekulu (Box of 5)', telugu: 'అత్రేయపురం పూతరేకులు', description: 'Authentic Atreyapuram Pootharekulu - Box of 5 pieces', category: 'sweets', price: 200, image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', isBestseller: true, isSpecial: true },
  { itemId: 'sweet-04', name: 'Bellam Jalebi (Hot & Crispy 250g)', telugu: 'బెల్లం జిలేబీ', description: 'Hot and crispy bellam jalebi - 250g', category: 'sweets', price: 100, image: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?auto=format&fit=crop&w=800&q=80', isBestseller: false },
];

async function run() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected!\n');

  let added = 0, skipped = 0;
  for (const item of MISSING_ITEMS) {
    const full = {
      ...item,
      isAvailable: true,
      isActive: true,
      isVeg: true,
      preparationTime: item.preparationTime || '10-15 Mins',
      spiceLevel: item.spiceLevel || 'medium',
      dietary: [],
    };
    try {
      await MenuItem.create(full);
      console.log(`  ✅ Added: ${item.name} (${item.itemId})`);
      added++;
    } catch (err) {
      if (err.code === 11000) {
        console.log(`  ⚠️  Already exists: ${item.name} (${item.itemId})`);
        skipped++;
      } else {
        console.error(`  ❌ Error adding ${item.name}:`, err.message);
      }
    }
  }

  console.log(`\n✅ Done! Added: ${added}, Skipped (already exist): ${skipped}`);
  await mongoose.disconnect();
}

run().catch(console.error);
