const db = require('../config/database');
const { encrypt, decrypt, hashPassword, comparePassword } = require('../utils/encryption');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');

class UserModel {
  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const user = await db('users')
      .where({ id })
      .whereNull('deleted_at')
      .first();
    
    return user ? this.sanitize(user) : null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const user = await db('users')
      .where({ email: email.toLowerCase() })
      .whereNull('deleted_at')
      .first();
    
    return user ? this.sanitize(user) : null;
  }

  /**
   * Create new user
   * @param {Object} data - User data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    // Check if email exists
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await hashPassword(data.password);
    
    const [user] = await db('users')
      .insert({
        email: data.email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        status: data.status || 'pending',
        email_verification_token: data.verificationToken
      })
      .returning('*');

    return this.sanitize(user);
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  static async update(id, data) {
    const updateData = {};
    
    if (data.firstName) updateData.first_name = data.firstName;
    if (data.lastName) updateData.last_name = data.lastName;
    if (data.phone) updateData.phone = data.phone;
    if (data.avatarUrl) updateData.avatar_url = data.avatarUrl;
    if (data.status) updateData.status = data.status;
    if (data.notificationPreferences) {
      updateData.notification_preferences = JSON.stringify(data.notificationPreferences);
    }

    const [user] = await db('users')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (!user) {
      throw new NotFoundError('User');
    }

    return this.sanitize(user);
  }

  /**
   * Delete user (soft delete)
   * @param {string} id - User ID
   */
  static async delete(id) {
    const result = await db('users')
      .where({ id })
      .update({ deleted_at: new Date() });

    if (result === 0) {
      throw new NotFoundError('User');
    }
  }

  /**
   * Verify password
   * @param {string} email - User email
   * @param {string} password - Password to verify
   * @returns {Promise<Object|null>}
   */
  static async verifyPassword(email, password) {
    const user = await db('users')
      .where({ email: email.toLowerCase() })
      .whereNull('deleted_at')
      .first();

    if (!user) return null;

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) return null;

    return this.sanitize(user);
  }

  /**
   * Update password
   * @param {string} id - User ID
   * @param {string} newPassword - New password
   */
  static async updatePassword(id, newPassword) {
    const hashedPassword = await hashPassword(newPassword);
    
    await db('users')
      .where({ id })
      .update({
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null
      });
  }

  /**
   * Set password reset token
   * @param {string} email - User email
   * @param {string} token - Reset token
   * @param {Date} expires - Expiration date
   */
  static async setResetToken(email, token, expires) {
    await db('users')
      .where({ email: email.toLowerCase() })
      .update({
        password_reset_token: token,
        password_reset_expires: expires
      });
  }

  /**
   * Find by reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object|null>}
   */
  static async findByResetToken(token) {
    const user = await db('users')
      .where({
        password_reset_token: token,
        password_reset_expires: db.raw('password_reset_expires > NOW()')
      })
      .first();

    return user ? this.sanitize(user) : null;
  }

  /**
   * Verify email
   * @param {string} token - Verification token
   */
  static async verifyEmail(token) {
    const result = await db('users')
      .where({ email_verification_token: token })
      .update({
        email_verified: true,
        email_verified_at: new Date(),
        email_verification_token: null,
        status: 'active'
      });

    if (result === 0) {
      throw new ValidationError('Invalid or expired verification token');
    }
  }

  /**
   * Update last login
   * @param {string} id - User ID
   * @param {string} ip - IP address
   */
  static async updateLastLogin(id, ip) {
    await db('users')
      .where({ id })
      .update({
        last_login_at: new Date(),
        last_login_ip: ip
      });
  }

  /**
   * List users with pagination
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async list(filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = db('users')
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc');

    if (filters.status) {
      query.where('status', filters.status);
    }

    if (filters.search) {
      query.where(builder => {
        builder
          .where('email', 'ilike', `%${filters.search}%`)
          .orWhere('first_name', 'ilike', `%${filters.search}%`)
          .orWhere('last_name', 'ilike', `%${filters.search}%`);
      });
    }

    const offset = (pagination.page - 1) * pagination.limit;
    
    const [countResult, rows] = await Promise.all([
      query.clone().count('* as count').first(),
      query.limit(pagination.limit).offset(offset)
    ]);

    return {
      data: rows.map(this.sanitize),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      }
    };
  }

  /**
   * Get user with roles
   * @param {string} id - User ID
   * @returns {Promise<Object|null>}
   */
  static async getWithRoles(id) {
    const user = await this.findById(id);
    if (!user) return null;

    const roles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', id)
      .select('roles.id', 'roles.name', 'roles.slug');

    return { ...user, roles };
  }

  /**
   * Assign role to user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @param {string} assignedBy - Assigning user ID
   */
  static async assignRole(userId, roleId, assignedBy) {
    await db('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy
      })
      .onConflict(['user_id', 'role_id'])
      .ignore();
  }

  /**
   * Remove role from user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   */
  static async removeRole(userId, roleId) {
    await db('user_roles')
      .where({ user_id: userId, role_id: roleId })
      .delete();
  }

  /**
   * Sanitize user object (remove sensitive fields)
   * @param {Object} user - Raw user object
   * @returns {Object} Sanitized user
   */
  static sanitize(user) {
    const {
      password_hash,
      password_reset_token,
      password_reset_expires,
      email_verification_token,
      two_factor_secret,
      ...sanitized
    } = user;
    
    return sanitized;
  }
}

module.exports = UserModel;
