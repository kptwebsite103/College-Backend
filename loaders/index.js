const mysqlLoader = require('./mysqlLoader');
const redisLoader = require('./redisLoader');
const startScheduler = require('./scheduler');
const startQueues = require('./queueLoader');
const expressLoader = require('./expressLoader');
const socketLoader = require('./socketLoader');

module.exports = async function startLoaders() {
  // Connect to databases first
  await mysqlLoader();
  const redis = await redisLoader();

  // Start background tasks
  const scheduler = startScheduler();
  let queues = null;
  if (redis && redis.client) {
    try {
      queues = startQueues();
    } catch (err) {
      console.warn('Failed to start queues (Redis not available?):', err.message);
      queues = null;
    }
  } else {
    console.warn('Skipping queue initialization because Redis is unavailable');
  }

  // Return loaders that require app/server instances for later initialization
  return {
    redis,
    scheduler,
    queues,
    express: expressLoader,
    socket: socketLoader,
  };
};
