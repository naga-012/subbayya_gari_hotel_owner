const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password hash'],
    },
    role: {
      type: String,
      enum: ['customer', 'owner', 'staff'],
      default: 'customer',
      index: true,
    },
    address: {
      type: String,
      default: '',
    },
    loyaltyCoins: {
      type: Number,
      default: 50,
    },
    tier: {
      type: String,
      default: 'Silver',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
