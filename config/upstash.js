const { Redis } = require('@upstash/redis');

// Upstash Redis configuration
// Uses REST API instead of TCP connection, better for serverless environments

function createUpstashClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Upstash Redis credentials not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
  }

  return new Redis({
    url,
    token,
  });
}

// Create a client that mimics the Redis client interface for compatibility
function createCompatibleClient() {
  const upstash = createUpstashClient();

  // Wrap Upstash methods to match node-redis interface
  const client = {
    upstash: true, // Mark as Upstash client
    get: (key) => upstash.get(key),
    set: (key, value) => upstash.set(key, value),
    setEx: (key, ttl, value) => upstash.setex(key, ttl, value),
    del: (key) => upstash.del(key),
    expire: (key, ttl) => upstash.expire(key, ttl),
    zadd: (key, score, member) => upstash.zadd(key, { score, member }),
    zremrangebyscore: (key, min, max) => upstash.zremrangebyscore(key, min, max),
    zcard: (key) => upstash.zcard(key),
    incr: (key) => upstash.incr(key),
    decr: (key) => upstash.decr(key),
    exists: (key) => upstash.exists(key),
    ttl: (key) => upstash.ttl(key),
    // Add more methods as needed
  };

  return client;
}

module.exports = { createUpstashClient, createCompatibleClient };