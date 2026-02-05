const mongoose = require('mongoose');
const logger = require('./logger');

// Centralized MongoDB connection helpers. This module exposes:
// - connect(uri, opts): connect once
// - connectWithRetry(options): connect with retry/backoff reading env defaults
// - disconnect(): disconnect cleanly

async function connect(uri, opts = {}) {
  // Mongoose v7 removed `useNewUrlParser` and `useUnifiedTopology` options.
  // Do not pass unsupported legacy options to the driver; allow callers to pass other mongoose options.
  const defaultOpts = {
    // increased timeouts for cloud connections
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 45000,
    ...opts,
  };

  // Remove legacy options if present in opts (backwards compatible)
  ['useNewUrlParser', 'useUnifiedTopology'].forEach((k) => {
    if (k in defaultOpts) {
      delete defaultOpts[k];
      logger.warn(`Removed deprecated mongo option: ${k}`);
    }
  });

  if (!uri) {
    throw new Error('MONGODB_URI (or DATABASE_URL) is not set');
  }

  try {
    await mongoose.connect(uri, defaultOpts);
    logger.info('MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    logger.error('MongoDB connection error:', err && err.message ? err.message : err);
    throw err;
  }
}

async function disconnect() {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (err) {
    logger.warn('Error while disconnecting mongoose:', err && err.message ? err.message : err);
  }
}

/**
 * Connect with retry/backoff using environment variables as defaults.
 * Options:
 *  - uri
 *  - attempts (default from DB_CONN_RETRY_ATTEMPTS or 5)
 *  - delayMs (base delay in ms, default DB_CONN_RETRY_DELAY_MS or 2000)
 *  - onAttempt(err, attempt) optional hook
 */
async function connectWithRetry(opts = {}) {
  const uri = opts.uri || process.env.MONGODB_URI || process.env.DATABASE_URL;
  const maxAttempts = Number(opts.attempts ?? process.env.DB_CONN_RETRY_ATTEMPTS ?? 5);
  const baseDelay = Number(opts.delayMs ?? process.env.DB_CONN_RETRY_DELAY_MS ?? 2000);

  if (!uri) {
    throw new Error('MONGODB_URI or DATABASE_URL must be provided to connectWithRetry');
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await connect(uri, opts.connectOpts || {});
    } catch (err) {
      const isLast = attempt === maxAttempts;
      if (opts.onAttempt && typeof opts.onAttempt === 'function') {
        try {
          opts.onAttempt(err, attempt, maxAttempts);
        } catch (e) {
          // ignore hook errors
        }
      }

      logger.error(`DB connect attempt ${attempt}/${maxAttempts} failed:`, err && err.message ? err.message : err);
      if (isLast) {
        logger.error('Failed to connect to DB after retries.');
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1); // exponential backoff
      logger.info(`Retrying DB connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

module.exports = { connect, connectWithRetry, disconnect, mongoose };

