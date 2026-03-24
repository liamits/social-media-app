const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ins';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB (ins)');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
