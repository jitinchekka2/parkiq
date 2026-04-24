const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

const keys = {
  spotAvailability: (id) => `spot:availability:${id}`,
  otpCode: (phone) => `otp:${phone}`,
  bookingHold: (spotId, userId) => `booking:hold:${spotId}:${userId}`,
};

module.exports = { redis, keys };