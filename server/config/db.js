const mongoose = require('mongoose');

let memoryServerInstance = null;

const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  try {
    // Attempt standard connection to specified URI
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    await checkAndSeedData();
    return conn;
  } catch (error) {
    console.warn(`[Database] Local/Configured MongoDB connection failed (${error.message}).`);
    console.log('[Database] Starting built-in in-memory MongoDB instance for seamless instant execution...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const inMemoryUri = memoryServerInstance.getUri();
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[Database] In-Memory MongoDB Connected at ${inMemoryUri}`);

      // Seed database with sample data
      await checkAndSeedData(true);
      return conn;
    } catch (inMemError) {
      console.error(`[Database Error] Could not start database: ${inMemError.message}`);
      throw inMemError;
    }
  }
};

const checkAndSeedData = async (forceSeed = false) => {
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0 || forceSeed) {
      console.log('[Database] Database is empty. Auto-seeding initial users, subjects, and attendance records...');
      const seedDatabase = require('../scripts/seed');
      await seedDatabase(false);
    }
  } catch (err) {
    console.error(`[Database Seed Warning] Auto-seed failed: ${err.message}`);
  }
};

module.exports = connectDB;
