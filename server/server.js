const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Startup validation of critical environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    `[Configuration Error] Missing essential environment variables: ${missingVars.join(', ')}`
  );
  console.error('Please configure them in server/.env before starting the server.');
  process.exit(1);
}

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Student Attendance Management Server Running`);
      console.log(`📡 Port: ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`====================================================`);
    });

    // Handle unhandled promise rejections gracefully
    process.on('unhandledRejection', (err) => {
      console.error(`[Unhandled Rejection] ${err.name}: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error(`[Uncaught Exception] ${err.name}: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`Fatal Server Startup Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
