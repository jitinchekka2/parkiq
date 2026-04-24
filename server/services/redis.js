const Redis = require('ioredis');

const createMemoryRedis = () => {
  const store = new Map();
  const timers = new Map();

  const clearExpiry = (key) => {
    const timeout = timers.get(key);
    if (timeout) {
      clearTimeout(timeout);
      timers.delete(key);
    }
  };

  return {
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async setex(key, ttlSeconds, value) {
      store.set(key, String(value));
      clearExpiry(key);
      const timeout = setTimeout(() => {
        store.delete(key);
        timers.delete(key);
      }, Number(ttlSeconds) * 1000);
      timers.set(key, timeout);
      return 'OK';
    },
    async del(...keysToDelete) {
      let removed = 0;
      for (const key of keysToDelete) {
        if (store.delete(key)) removed += 1;
        clearExpiry(key);
      }
      return removed;
    },
    async incr(key) {
      const next = (parseInt(store.get(key) || '0', 10) || 0) + 1;
      store.set(key, String(next));
      return next;
    },
    async decr(key) {
      const next = (parseInt(store.get(key) || '0', 10) || 0) - 1;
      store.set(key, String(next));
      return next;
    },
    async quit() {
      return 'OK';
    },
  };
};

const hasRedisUrl = Boolean(process.env.REDIS_URL);

const redis = hasRedisUrl
  ? new Redis(process.env.REDIS_URL, {
      tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    })
  : createMemoryRedis();

if (hasRedisUrl) {
  redis.on('connect', () => console.log('✅ Redis connected'));
  redis.on('error', (err) => console.error('Redis error:', err));
} else {
  console.warn('⚠️ REDIS_URL is not set; using in-memory Redis fallback');
}

const keys = {
  spotAvailability: (id) => `spot:availability:${id}`,
  otpCode: (phone) => `otp:${phone}`,
  bookingHold: (spotId, userId) => `booking:hold:${spotId}:${userId}`,
};

module.exports = { redis, keys };