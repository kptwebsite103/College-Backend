const { createClient } = require('redis');
const { createCompatibleClient } = require('./upstash');
const logger = require('./logger');

// Redis configuration helpers (configuration only — no business logic)
// Exports:
// - createRedisClient(opts): returns a configured Redis client (does not connect)
// - connectClient(client, { attempts, delayMs }): connects client with retry/backoff
// - disconnectClient(client): gracefully quits the client
// - isReady(client): boolean check

function _resolveUrl() {
  return process.env.REDIS_URL || process.env.REDIS || 'redis://127.0.0.1:6379';
}

function createRedisClient(opts = {}) {
  // Check if Upstash credentials are available
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    logger.info('Using Upstash Redis');
    return createCompatibleClient();
  }

  // Fall back to regular Redis
  const url = _resolveUrl();

  // Default socket options; allow override via opts
  const defaultOpts = {
    url,
    socket: {
      keepAlive: 5000,
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 10000),
    },
    ...opts,
  };

  const client = createClient(defaultOpts);

  // Avoid auto-connecting here; caller should call connectClient() when ready.
  return client;
}

async function connectClient(client, options = {}) {
  if (!client) throw new Error('No redis client provided');

  // Upstash clients don't need explicit connection
  if (client.upstash) {
    logger.info('Upstash Redis ready (no connection needed)');
    return client;
  }

  // Regular Redis connection logic
  const attempts = Number(options.attempts ?? process.env.REDIS_CONN_RETRY_ATTEMPTS ?? 5);
  const baseDelay = Number(options.delayMs ?? process.env.REDIS_CONN_RETRY_DELAY_MS ?? 2000);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await client.connect();
      client.on('error', (err) => logger.error('Redis error:', err));
      client.on('connect', () => logger.info('Redis connected'));
      return client;
    } catch (err) {
      const isLast = attempt === attempts;
      logger.error(`Redis connect attempt ${attempt}/${attempts} failed:`, err && err.message ? err.message : err);
      if (isLast) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.info(`Retrying Redis connection in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function disconnectClient(client) {
  if (!client) return;

  // Upstash clients don't need explicit disconnection
  if (client.upstash) {
    logger.info('Upstash Redis client cleanup (no disconnection needed)');
    return;
  }

  try {
    // Prefer graceful quit which waits for pending commands
    if (typeof client.quit === 'function') await client.quit();
    else if (typeof client.disconnect === 'function') client.disconnect();
    logger.info('Redis disconnected');
  } catch (err) {
    logger.warn('Error during Redis disconnect:', err && err.message ? err.message : err);
    try {
      if (typeof client.disconnect === 'function') client.disconnect();
    } catch (_) {
      // ignore
    }
  }
}

function isReady(client) {
  if (!client) return false;

  // Upstash clients are always ready (REST API)
  if (client.upstash) return true;

  // Regular Redis check
  return client.isOpen === true;
}

module.exports = { createRedisClient, connectClient, disconnectClient, isReady };

