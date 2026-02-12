const compression = require('compression');
const { queryOptimizer } = require('./performance');

/**
 * Database query optimization middleware
 * Adds query hints and optimization
 */
const queryOptimizationMiddleware = (db) => {
  return async (req, res, next) => {
    // Attach query optimizer to request
    req.db = db;
    req.optimizeQuery = (queryBuilder) => {
      // Add common optimizations
      return queryBuilder
        .maxExecutionTime(5000) // 5 second timeout
        .options({ rowMode: 'array' }); // Faster for large datasets
    };

    // Monitor query performance
    const originalThen = db.query;
    
    next();
  };
};

/**
 * Response compression configuration
 */
const compressionConfig = {
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balanced compression
  threshold: 1024 // Only compress responses > 1KB
};

/**
 * Pagination helper for large datasets
 */
const paginate = async (query, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = Math.min(parseInt(options.limit) || 20, 100); // Max 100 per page
  const offset = (page - 1) * limit;

  const startTime = Date.now();
  
  const [data, countResult] = await Promise.all([
    query.clone().limit(limit).offset(offset),
    query.clone().clearSelect().count('* as count').first()
  ]);

  const duration = Date.now() - startTime;
  queryOptimizer.logQuery(query.toString(), [], duration);

  const total = parseInt(countResult.count);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

/**
 * Eager loading helper to prevent N+1 queries
 */
const withRelations = (query, relations = []) => {
  relations.forEach(relation => {
    query = query.with(relation);
  });
  return query;
};

/**
 * Select specific columns to reduce data transfer
 */
const selectColumns = (query, columns) => {
  if (columns && columns.length > 0) {
    return query.select(columns);
  }
  return query;
};

/**
 * Batch processing helper for large operations
 */
const batchProcess = async (items, batchSize, processor) => {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Small delay to prevent event loop blocking
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  return results;
};

/**
 * Connection pooling configuration
 */
const dbPoolConfig = {
  min: 2,
  max: 20,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
};

/**
 * Redis caching strategies
 */
const cacheStrategies = {
  // Cache frequently accessed data
  frequent: { ttl: 300 }, // 5 minutes
  
  // Cache semi-static data
  semiStatic: { ttl: 3600 }, // 1 hour
  
  // Cache reference data
  reference: { ttl: 86400 }, // 24 hours
  
  // Don't cache
  none: { ttl: 0 }
};

module.exports = {
  queryOptimizationMiddleware,
  compressionConfig,
  paginate,
  withRelations,
  selectColumns,
  batchProcess,
  dbPoolConfig,
  cacheStrategies
};
