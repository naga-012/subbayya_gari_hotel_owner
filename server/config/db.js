const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 5000,
    };

    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/subbayya_gari_hotel';
    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log(`[MongoDB] Connected to database: ${m.connection.host}/${m.connection.name}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`[MongoDB] Connection Error: ${error.message}`);
    return null;
  }
};

module.exports = connectDB;
