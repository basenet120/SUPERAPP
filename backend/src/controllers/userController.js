const UserModel = require('../models/User');
const { logAudit } = require('../utils/audit');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { getUserRoles } = require('../middleware/rbac');
const db = require('../config/database');

class UserController {
  /**
   * List users
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, status, search } = req.query;

      const result = await UserModel.list(
        { status, search },
        { page: parseInt(page), limit: parseInt(limit) }
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await UserModel.getWithRoles(id);

      if (!user) {
        throw new NotFoundError('User');
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async create(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone, roleIds } = req.body;

      if (!email || !password || !firstName || !lastName) {
        throw new ValidationError('Email, password, first name, and last name are required');
      }

      const user = await UserModel.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        status: 'active'
      });

      // Assign roles if provided
      if (roleIds && roleIds.length > 0) {
        for (const roleId of roleIds) {
          await UserModel.assignRole(user.id, roleId, req.user.id);
        }
      }

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'create',
        resource: 'user',
        resourceId: user.id,
        newValues: { email, firstName, lastName },
        req
      });

      const userWithRoles = await UserModel.getWithRoles(user.id);

      res.status(201).json({
        success: true,
        data: userWithRoles
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, status, avatarUrl } = req.body;

      const oldUser = await UserModel.findById(id);
      if (!oldUser) {
        throw new NotFoundError('User');
      }

      const user = await UserModel.update(id, {
        firstName,
        lastName,
        phone,
        status,
        avatarUrl
      });

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'update',
        resource: 'user',
        resourceId: id,
        oldValues: oldUser,
        newValues: user,
        req
      });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await UserModel.delete(id);

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'delete',
        resource: 'user',
        resourceId: id,
        req
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign role to user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async assignRole(req, res, next) {
    try {
      const { id } = req.params;
      const { roleId } = req.body;

      if (!roleId) {
        throw new ValidationError('Role ID is required');
      }

      await UserModel.assignRole(id, roleId, req.user.id);

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'assign_role',
        resource: 'user',
        resourceId: id,
        newValues: { roleId },
        req
      });

      res.json({
        success: true,
        message: 'Role assigned successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove role from user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async removeRole(req, res, next) {
    try {
      const { id, roleId } = req.params;

      await UserModel.removeRole(id, roleId);

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'remove_role',
        resource: 'user',
        resourceId: id,
        oldValues: { roleId },
        req
      });

      res.json({
        success: true,
        message: 'Role removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get roles list
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getRoles(req, res, next) {
    try {
      const roles = await db('roles').orderBy('level', 'desc');

      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permissions list
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getPermissions(req, res, next) {
    try {
      const permissions = await db('permissions').orderBy('resource');

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user permissions
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getUserPermissions(req, res, next) {
    try {
      const { id } = req.params;
      const permissions = await require('../middleware/rbac').getUserPermissions(id);

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone, avatarUrl, notificationPreferences } = req.body;

      const user = await UserModel.update(req.user.id, {
        firstName,
        lastName,
        phone,
        avatarUrl,
        notificationPreferences
      });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
