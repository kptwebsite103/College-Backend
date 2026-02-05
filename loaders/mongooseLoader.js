require('dotenv').config();
const mongoose = require('mongoose');
const { connectWithRetry } = require('../config/database');
const logger = require('../config/logger');

// This loader delegates retry/backoff logic to config/database.connectWithRetry
module.exports = async function mongooseLoader() {
  await connectWithRetry({
    attempts: Number(process.env.DB_CONN_RETRY_ATTEMPTS || 5),
    delayMs: Number(process.env.DB_CONN_RETRY_DELAY_MS || 2000),
    // optional onAttempt hook logs are redundant since connectWithRetry already logs, but kept for extendability
    onAttempt: (err, attempt, max) => {
      // Could forward metrics or logs here
    },
  });

  // Handle DB connection events
  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.info('Mongoose disconnected from MongoDB');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('Mongoose reconnected to MongoDB');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('Mongoose connection closed due to app termination');
    process.exit(0);
  });
};
