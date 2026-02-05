const redisService = require('../services/redis.service');

function rateLimitMiddleware(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 100; // limit each IP to 100 requests per windowMs
  const keyPrefix = options.keyPrefix || 'ratelimit:';
  const keyGenerator = options.keyGenerator || ((req) => req.ip);

  return async (req, res, next) => {
    const key = keyPrefix + keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // For simplicity, use a counter with TTL instead of sorted set
      // This is less accurate but simpler and works with Upstash
      const countKey = `${key}:count`;
      const resetKey = `${key}:reset`;

      let count = await redisService.get(countKey);
      let resetTime = await redisService.get(resetKey);

      if (!count || !resetTime || now > parseInt(resetTime)) {
        // Reset counter
        count = 0;
        resetTime = now + windowMs;
        await redisService.set(countKey, '0', Math.ceil(windowMs / 1000));
        await redisService.set(resetKey, resetTime.toString(), Math.ceil(windowMs / 1000));
      }

      count = parseInt(count) + 1;

      if (count > max) {
        return res.status(429).json({
          message: 'Too many requests',
          retryAfter: Math.ceil((parseInt(resetTime) - now) / 1000)
        });
      }

      // Update counter
      await redisService.set(countKey, count.toString(), Math.ceil((parseInt(resetTime) - now) / 1000));

      // Add headers
      res.set('X-RateLimit-Limit', max);
      res.set('X-RateLimit-Remaining', Math.max(0, max - count));
      res.set('X-RateLimit-Reset', new Date(parseInt(resetTime)).toISOString());

      next();
    } catch (err) {
      console.warn('Rate limit error:', err.message);
      next(); // On error, allow request
    }
  };
}

module.exports = rateLimitMiddleware;