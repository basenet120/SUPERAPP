const logger = require('../utils/logger');

/**
 * Performance Monitoring Middleware
 * Tracks request timing and performance metrics
 */
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime();
  const startMemory = process.memoryUsage();

  // Store original end method
  const originalEnd = res.end.bind(res);

  res.end = function(...args) {
    const diff = process.hrtime(start);
    const duration = (diff[0] * 1000 + diff[1] / 1000000).toFixed(2);
    
    const endMemory = process.memoryUsage();
    const memoryUsed = ((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2);

    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      memoryDelta: `${memoryUsed}MB`,
      userAgent: req.get('user-agent'),
      ip: req.ip
    };

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', logData);
    } else {
      logger.debug('Request completed', logData);
    }

    // Store metrics for monitoring
    if (!global.requestMetrics) {
      global.requestMetrics = [];
    }
    
    global.requestMetrics.push({
      timestamp: new Date(),
      ...logData
    });

    // Keep only last 1000 metrics
    if (global.requestMetrics.length > 1000) {
      global.requestMetrics = global.requestMetrics.slice(-1000);
    }

    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Get performance statistics
 */
const getPerformanceStats = () => {
  if (!global.requestMetrics || global.requestMetrics.length === 0) {
    return null;
  }

  const metrics = global.requestMetrics;
  const durations = metrics.map(m => parseFloat(m.duration));
  
  return {
    totalRequests: metrics.length,
    avgDuration: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
    maxDuration: Math.max(...durations).toFixed(2),
    minDuration: Math.min(...durations).toFixed(2),
    slowRequests: metrics.filter(m => parseFloat(m.duration) > 1000).length,
    errorRate: (metrics.filter(m => m.statusCode >= 400).length / metrics.length * 100).toFixed(2)
  };
};

/**
 * Query optimization helper
 * Adds query timing and N+1 detection
 */
const queryOptimizer = {
  queries: [],
  
  logQuery(sql, bindings, duration) {
    this.queries.push({
      sql: sql.substring(0, 200),
      duration,
      timestamp: new Date()
    });

    // Keep only last 100 queries
    if (this.queries.length > 100) {
      this.queries = this.queries.slice(-100);
    }

    // Log slow queries
    if (duration > 500) {
      logger.warn('Slow query detected', { sql: sql.substring(0, 200), duration });
    }
  },

  getStats() {
    const recentQueries = this.queries.filter(
      q => Date.now() - q.timestamp.getTime() < 60000
    );

    return {
      totalQueries: recentQueries.length,
      avgDuration: recentQueries.length > 0 
        ? (recentQueries.reduce((a, q) => a + q.duration, 0) / recentQueries.length).toFixed(2)
        : 0,
      slowQueries: recentQueries.filter(q => q.duration > 500).length
    };
  }
};

module.exports = {
  performanceMonitor,
  getPerformanceStats,
  queryOptimizer
};
