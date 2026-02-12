const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../config/database');
const { AuthenticationError } = require('../utils/errors');

/**
 * Extract JWT token from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

/**
 * Middleware to authenticate JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Check if user exists and is active
    const user = await db('users')
      .where({ id: decoded.userId })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (user.status !== 'active') {
      throw new AuthenticationError('Account is not active');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      roles: decoded.roles || []
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired'
        }
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      });
    }

    next(error);
  }
};

/**
 * Optional authentication - attaches user if token valid, continues regardless
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await db('users')
        .where({ id: decoded.userId })
        .whereNull('deleted_at')
        .first();

      if (user && user.status === 'active') {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          roles: decoded.roles || []
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

/**
 * Generate JWT tokens
 * @param {Object} user - User object
 * @returns {Object} Access and refresh tokens
 */
const generateTokens = async (user) => {
  // Get user roles
  const roles = await db('user_roles')
    .join('roles', 'user_roles.role_id', 'roles.id')
    .where('user_roles.user_id', user.id)
    .pluck('roles.slug');

  const payload = {
    userId: user.id,
    email: user.email,
    roles
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  // Store refresh token in database
  await db('refresh_tokens').insert({
    user_id: user.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn
  };
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} New tokens
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    
    // Check if refresh token exists and is valid
    const tokenRecord = await db('refresh_tokens')
      .where({
        token: refreshToken,
        user_id: decoded.userId,
        revoked: false
      })
      .where('expires_at', '>', new Date())
      .first();

    if (!tokenRecord) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Get user
    const user = await db('users')
      .where({ id: decoded.userId })
      .whereNull('deleted_at')
      .first();

    if (!user || user.status !== 'active') {
      throw new AuthenticationError('User not found or inactive');
    }

    // Revoke old refresh token
    await db('refresh_tokens')
      .where({ id: tokenRecord.id })
      .update({
        revoked: true,
        revoked_at: new Date()
      });

    // Generate new tokens
    return generateTokens(user);
  } catch (error) {
    throw new AuthenticationError('Invalid refresh token');
  }
};

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId - User ID
 */
const revokeAllUserTokens = async (userId) => {
  await db('refresh_tokens')
    .where({ user_id: userId, revoked: false })
    .update({
      revoked: true,
      revoked_at: new Date()
    });
};

module.exports = {
  authenticate,
  optionalAuth,
  generateTokens,
  refreshAccessToken,
  revokeAllUserTokens
};
