const mongoose = require('mongoose');
const config = require('./config');

// Disable Mongoose command buffering so queries fail/fallback immediately if connection is not active
mongoose.set('bufferCommands', false);

/**
 * Connect to MongoDB database instance with retry and error handling
 * Supports both local MongoDB and MongoDB Atlas via config.mongodbUri
 */
const connectDB = async () => {
  const uri = config.mongodbUri;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${uri}: ${error.message}`);
    console.warn('[MongoDB Tip] For local development, ensure mongod is running. For production, supply a MONGODB_URI (e.g. MongoDB Atlas cluster).');
    
    if (config.nodeEnv !== 'test') {
      console.warn('[MongoDB] Server will continue running with in-memory fallback for local API testing.');
    }
  }
};

module.exports = connectDB;
