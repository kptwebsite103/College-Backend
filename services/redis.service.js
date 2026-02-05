const { getClient } = require('../loaders/redisLoader');

// Redis service for caching, rate limiting, and OTP storage
class RedisService {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      this.client = getClient();
    }
    return this.client;
  }

  // Caching methods
  async get(key) {
    const client = this.getClient();
    if (!client) return null;
    try {
      return await client.get(key);
    } catch (err) {
      console.warn('Redis get error:', err.message);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    const client = this.getClient();
    if (!client) return false;
    try {
      if (ttl) {
        return await client.setEx(key, ttl, value);
      }
      return await client.set(key, value);
    } catch (err) {
      console.warn('Redis set error:', err.message);
      return false;
    }
  }

  async del(key) {
    const client = this.getClient();
    if (!client) return false;
    try {
      return await client.del(key);
    } catch (err) {
      console.warn('Redis del error:', err.message);
      return false;
    }
  }

  // Rate limiting methods
  async increment(key, ttl = 60) {
    const client = this.getClient();
    if (!client) return null;
    try {
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, ttl);
      }
      return count;
    } catch (err) {
      console.warn('Redis increment error:', err.message);
      return null;
    }
  }

  // OTP/Token storage
  async storeOTP(identifier, otp, ttl = 300) { // 5 minutes default
    return this.set(`otp:${identifier}`, otp, ttl);
  }

  async getOTP(identifier) {
    return this.get(`otp:${identifier}`);
  }

  async deleteOTP(identifier) {
    return this.del(`otp:${identifier}`);
  }

  async storeToken(identifier, token, ttl = 3600) { // 1 hour default
    return this.set(`token:${identifier}`, token, ttl);
  }

  async getToken(identifier) {
    return this.get(`token:${identifier}`);
  }

  async deleteToken(identifier) {
    return this.del(`token:${identifier}`);
  }

  // Cache with JSON serialization
  async getJSON(key) {
    const data = await this.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (err) {
      console.warn('JSON parse error:', err.message);
      return null;
    }
  }

  async setJSON(key, value, ttl = null) {
    try {
      const json = JSON.stringify(value);
      return this.set(key, json, ttl);
    } catch (err) {
      console.warn('JSON stringify error:', err.message);
      return false;
    }
  }
}

module.exports = new RedisService();