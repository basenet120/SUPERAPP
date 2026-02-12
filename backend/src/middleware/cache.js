const { getRedis } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Response Caching Middleware
 * Caches GET requests in Redis for improved performance
 */
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated requests that return user-specific data
    if (req.headers.authorization && !req.path.includes('/public/')) {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;
    const redis = getRedis();

    try {
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        logger.debug(`Cache hit for ${req.originalUrl}`);
        return res.json(JSON.parse(cached));
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = (data) => {
        redis.setex(cacheKey, duration, JSON.stringify(data))
          .catch(err => logger.error('Cache set error:', err));
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Clear cache for specific patterns
 */
const clearCache = async (pattern) => {
  const redis = getRedis();
  try {
    const keys = await redis.keys(`cache:*${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Cleared ${keys.length} cache entries for pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error('Clear cache error:', error);
  }
};

/**
 * Cache invalidation middleware
 * Clears related caches when data is modified
 */
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      // Clear caches if response is successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patterns) {
          await clearCache(pattern);
        }
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  cacheMiddleware,
  clearCache,
  invalidateCache
};
