const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    // If not in test environment, log clear instructions for MongoDB setup
    if (process.env.NODE_ENV !== 'test') {
      console.error(
        'Please verify that MONGODB_URI is correctly set in server/.env (e.g. MongoDB Atlas cluster or local MongoDB daemon).'
      );
    }
    throw error;
  }
};

module.exports = connectDB;
