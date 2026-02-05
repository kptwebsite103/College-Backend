const { createRedisClient, connectClient, disconnectClient } = require('../config/redis');

let client;

module.exports = async function startRedis() {
  if (client) return { client, stop: async () => disconnectClient(client) };

  try {
    client = createRedisClient();

    await connectClient(client, {
      attempts: Number(process.env.REDIS_CONN_RETRY_ATTEMPTS || 5),
      delayMs: Number(process.env.REDIS_CONN_RETRY_DELAY_MS || 2000),
    });

    return {
      client,
      async stop() {
        await disconnectClient(client);
      },
    };
  } catch (err) {
    console.warn('Redis connection failed, proceeding without Redis:', err.message);
    client = null; // Set to null so middlewares skip Redis features
    return {
      client: null,
      async stop() {
        // No-op
      },
    };
  }
};

module.exports.getClient = function getClient() {
  return client;
};