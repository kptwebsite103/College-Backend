const Queue = require('bull');
const merge = require('lodash.merge');

// Default configuration values (can be overridden via env vars)
const DEFAULT_RETRIES = Number(process.env.BULL_DEFAULT_RETRIES ?? 3);
const DEFAULT_BACKOFF_MS = Number(process.env.BULL_DEFAULT_BACKOFF_MS ?? 5000);
const DEFAULT_CONCURRENCY = Number(process.env.BULL_DEFAULT_CONCURRENCY ?? 5);

function getDefaultJobOptions(overrides = {}) {
  return merge(
    {
      attempts: DEFAULT_RETRIES,
      backoff: {
        type: 'exponential',
        delay: DEFAULT_BACKOFF_MS,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
    overrides
  );
}

/**
 * Create a configured Bull queue. This function only configures queues (no job business logic).
 * - `name` queue name
 * - `opts` are passed to Bull's Queue constructor; safe defaults are applied
 */
function createQueue(name, opts = {}) {
  let redisConfig;

  // Check if Upstash is configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // For Bull with Upstash, we need to use the REST URL
    redisConfig = {
      url: process.env.UPSTASH_REDIS_REST_URL,
      password: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
  } else {
    // Regular Redis
    const redisUrl = process.env.REDIS_URL || process.env.REDIS || 'redis://127.0.0.1:6379';
    redisConfig = { url: redisUrl };
  }

  // Apply sensible defaultJobOptions if none provided
  const defaultJobOptions = getDefaultJobOptions(opts.defaultJobOptions || {});

  const queue = new Queue(name, {
    redis: redisConfig,
    defaultJobOptions,
    prefix: process.env.BULL_PREFIX || 'bull',
    ...opts,
  });

  return queue;
}

/**
 * Close a queue gracefully (wait for active jobs to finish for `timeout` ms)
 * Returns a promise that resolves when closed or rejects on error.
 */
function closeQueue(queue, timeout = Number(process.env.BULL_CLOSE_TIMEOUT_MS || 5000)) {
  if (!queue) return Promise.resolve();
  // Bull's close accepts a timeout and returns a promise
  return queue.close(timeout);
}

module.exports = { createQueue, getDefaultJobOptions, closeQueue, DEFAULTS: { DEFAULT_RETRIES, DEFAULT_BACKOFF_MS, DEFAULT_CONCURRENCY } };
