const db = require('../config/database');
const { AuthorizationError } = require('../utils/errors');

/**
 * Check if user has required permission
 * @param {string} permission - Required permission slug
 * @returns {Function} Express middleware
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError();
      }

      const hasPermission = await checkPermission(req.user.id, permission);
      
      if (!hasPermission) {
        throw new AuthorizationError(`Missing permission: ${permission}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has any of the required permissions
 * @param {string[]} permissions - Array of permission slugs
 * @returns {Function} Express middleware
 */
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError();
      }

      const userPermissions = await getUserPermissions(req.user.id);
      const hasAnyPermission = permissions.some(p => userPermissions.includes(p));
      
      if (!hasAnyPermission) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has all required permissions
 * @param {string[]} permissions - Array of permission slugs
 * @returns {Function} Express middleware
 */
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError();
      }

      const userPermissions = await getUserPermissions(req.user.id);
      const hasAllPermissions = permissions.every(p => userPermissions.includes(p));
      
      if (!hasAllPermissions) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has required role
 * @param {string} role - Required role slug
 * @returns {Function} Express middleware
 */
const requireRole = (role) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError();
      }

      const userRoles = await getUserRoles(req.user.id);
      
      if (!userRoles.includes(role)) {
        throw new AuthorizationError(`Required role: ${role}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has any of the required roles
 * @param {string[]} roles - Array of role slugs
 * @returns {Function} Express middleware
 */
const requireAnyRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError();
      }

      const userRoles = await getUserRoles(req.user.id);
      const hasAnyRole = roles.some(r => userRoles.includes(r));
      
      if (!hasAnyRole) {
        throw new AuthorizationError('Insufficient role');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Resource ownership check middleware
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 * @returns {Function} Express middleware
 */
const requireOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError();
      }

      // Admins bypass ownership check
      const userRoles = await getUserRoles(req.user.id);
      if (userRoles.includes('admin')) {
        return next();
      }

      const ownerId = await getResourceOwnerId(req);
      
      if (ownerId !== req.user.id) {
        throw new AuthorizationError('Not the resource owner');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has a specific permission
 * @param {string} userId - User ID
 * @param {string} permission - Permission slug
 * @returns {Promise<boolean>}
 */
const checkPermission = async (userId, permission) => {
  const userPermissions = await getUserPermissions(userId);
  return userPermissions.includes(permission);
};

/**
 * Get all permissions for a user (including role permissions)
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} Array of permission slugs
 */
const getUserPermissions = async (userId) => {
  // Get permissions from roles
  const rolePermissions = await db('user_roles')
    .join('role_permissions', 'user_roles.role_id', 'role_permissions.role_id')
    .join('permissions', 'role_permissions.permission_id', 'permissions.id')
    .where('user_roles.user_id', userId)
    .pluck('permissions.slug');

  // Get direct user permissions (grants)
  const directPermissions = await db('user_permissions')
    .join('permissions', 'user_permissions.permission_id', 'permissions.id')
    .where({
      'user_permissions.user_id': userId,
      'user_permissions.type': 'grant'
    })
    .pluck('permissions.slug');

  // Get direct user permissions (denies)
  const deniedPermissions = await db('user_permissions')
    .join('permissions', 'user_permissions.permission_id', 'permissions.id')
    .where({
      'user_permissions.user_id': userId,
      'user_permissions.type': 'deny'
    })
    .pluck('permissions.slug');

  // Combine and filter out denied permissions
  const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];
  return allPermissions.filter(p => !deniedPermissions.includes(p));
};

/**
 * Get all roles for a user
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} Array of role slugs
 */
const getUserRoles = async (userId) => {
  const roles = await db('user_roles')
    .join('roles', 'user_roles.role_id', 'roles.id')
    .where('user_roles.user_id', userId)
    .pluck('roles.slug');

  return roles;
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireAnyRole,
  requireOwnership,
  checkPermission,
  getUserPermissions,
  getUserRoles
};
