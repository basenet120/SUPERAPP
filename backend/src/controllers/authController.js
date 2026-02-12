const UserModel = require('../models/User');
const { generateTokens, refreshAccessToken, revokeAllUserTokens } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');
const { ValidationError, AuthenticationError, NotFoundError } = require('../utils/errors');
const crypto = require('crypto');

class AuthController {
  /**
   * Register new user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        throw new ValidationError('Email, password, first name, and last name are required');
      }

      if (password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters');
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const user = await UserModel.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        verificationToken,
        status: 'pending'
      });

      // TODO: Send verification email

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Verify credentials
      const user = await UserModel.verifyPassword(email, password);

      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      if (user.status === 'suspended') {
        throw new AuthenticationError('Account has been suspended');
      }

      if (user.status === 'pending') {
        throw new AuthenticationError('Please verify your email before logging in');
      }

      // Update last login
      await UserModel.updateLastLogin(user.id, req.ip);

      // Generate tokens
      const tokens = await generateTokens(user);

      // Log audit
      await logAudit({
        userId: user.id,
        action: 'login',
        resource: 'auth',
        resourceId: user.id,
        req
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            roles: tokens.roles
          },
          tokens
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token required');
      }

      const tokens = await refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: tokens
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (req.user) {
        await logAudit({
          userId: req.user.id,
          action: 'logout',
          resource: 'auth',
          resourceId: req.user.id,
          req
        });
      }

      // TODO: Revoke specific refresh token if provided

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async me(req, res, next) {
    try {
      const user = await UserModel.getWithRoles(req.user.id);

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
   * Verify email
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;

      await UserModel.verifyEmail(token);

      res.json({
        success: true,
        message: 'Email verified successfully. You can now log in.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError('Email is required');
      }

      const user = await UserModel.findByEmail(email);

      // Always return success to prevent email enumeration
      if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await UserModel.setResetToken(email, resetToken, expires);

        // TODO: Send password reset email
        console.log(`Password reset token for ${email}: ${resetToken}`);
      }

      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async resetPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password || password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters');
      }

      const user = await UserModel.findByResetToken(token);

      if (!user) {
        throw new ValidationError('Invalid or expired reset token');
      }

      await UserModel.updatePassword(user.id, password);

      // Revoke all tokens for security
      await revokeAllUserTokens(user.id);

      res.json({
        success: true,
        message: 'Password reset successfully. Please log in with your new password.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new ValidationError('Current password and new password are required');
      }

      if (newPassword.length < 8) {
        throw new ValidationError('New password must be at least 8 characters');
      }

      // Verify current password
      const user = await UserModel.verifyPassword(req.user.email, currentPassword);

      if (!user) {
        throw new ValidationError('Current password is incorrect');
      }

      await UserModel.updatePassword(req.user.id, newPassword);

      // Revoke all tokens
      await revokeAllUserTokens(req.user.id);

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'password_change',
        resource: 'auth',
        resourceId: req.user.id,
        req
      });

      res.json({
        success: true,
        message: 'Password changed successfully. Please log in again.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
