const { getClient } = require('../loaders/redisLoader');

function cacheMiddleware(options = {}) {
  const defaultTtl = options.ttl || 300; // 5 minutes default
  const keyPrefix = options.keyPrefix || 'cache:';
  const keyGenerator = options.keyGenerator || ((req) => `${req.method}:${req.originalUrl}`);
  const getTtl = options.getTtl || (() => defaultTtl); // Function to get TTL based on request

  return async (req, res, next) => {
    const client = getClient();
    if (!client) return next(); // No Redis, skip caching

    const cacheKey = keyPrefix + keyGenerator(req);
    const ttl = getTtl(req);

    try {
      // Check cache
      const cached = await client.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.status(parsed.status).json(parsed.body);
      }
    } catch (err) {
      console.warn('Cache read error:', err.message);
    }

    // Store original send
    const originalSend = res.send;
    let responseBody;
    let responseStatus = 200;

    res.send = function (body) {
      responseBody = body;
      responseStatus = res.statusCode;
      return originalSend.call(this, body);
    };

    res.on('finish', async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300 && responseBody) {
          const toCache = JSON.stringify({ status: responseStatus, body: JSON.parse(responseBody) });
          await client.setEx(cacheKey, ttl, toCache);
        }
      } catch (err) {
        console.warn('Cache write error:', err.message);
      }
    });

    next();
  };
}

module.exports = cacheMiddleware;