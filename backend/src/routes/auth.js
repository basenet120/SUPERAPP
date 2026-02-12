const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requirePermission, requireRole } = require('../middleware/rbac');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.get('/verify/:token', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.use(authenticate);

router.post('/logout', authController.logout);
router.get('/me', authController.me);
router.put('/me', userController.updateProfile);
router.post('/change-password', authController.changePassword);

// User management (admin only)
router.get('/users', requirePermission('users.view'), userController.list);
router.get('/users/roles', userController.getRoles);
router.get('/users/permissions', userController.getPermissions);
router.post('/users', requirePermission('users.create'), userController.create);
router.get('/users/:id', requirePermission('users.view'), userController.getById);
router.put('/users/:id', requirePermission('users.edit'), userController.update);
router.delete('/users/:id', requirePermission('users.delete'), userController.delete);
router.get('/users/:id/permissions', requirePermission('users.view'), userController.getUserPermissions);
router.post('/users/:id/roles', requirePermission('users.edit'), userController.assignRole);
router.delete('/users/:id/roles/:roleId', requirePermission('users.edit'), userController.removeRole);

module.exports = router;
