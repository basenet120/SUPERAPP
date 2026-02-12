const Redis = require('ioredis');
const config = require('./index');

let redis = null;

const getRedis = () => {
  if (!redis) {
    redis = new Redis(config.redis.url, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }
  return redis;
};

const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    redis = null;
  }
};

module.exports = {
  getRedis,
  closeRedis,
  redis: getRedis()
};
