const { AppError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.id,
    ip: req.ip
  });

  // Handle operational errors (expected errors)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.errors && { errors: err.errors })
      }
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError' || err.code === 'VALIDATION_ERROR') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        errors: err.errors || []
      }
    });
  }

  if (err.name === 'UnauthorizedError' || err.code === 'UNAUTHORIZED') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: err.message || 'Authentication required'
      }
    });
  }

  if (err.name === 'ForbiddenError' || err.code === 'FORBIDDEN') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: err.message || 'Access denied'
      }
    });
  }

  if (err.name === 'NotFoundError' || err.code === 'NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: err.message || 'Resource not found'
      }
    });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'Resource already exists'
      }
    });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      success: false,
      error: {
        code: 'REFERENTIAL_ERROR',
        message: 'Referenced resource does not exist'
      }
    });
  }

  // Default: internal server error
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message
    }
  });
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
