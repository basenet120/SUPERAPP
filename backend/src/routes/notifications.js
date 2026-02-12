const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');
const { asyncHandler } = require('../utils/errors');

// All routes require authentication
router.use(authenticate);

// Get notifications
router.get('/', asyncHandler(notificationController.getNotifications));

// Get unread count
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount));

// Get preferences
router.get('/preferences', asyncHandler(notificationController.getPreferences));

// Update preferences
router.put('/preferences', asyncHandler(notificationController.updatePreferences));

// Push notification subscription
router.post('/subscribe', asyncHandler(notificationController.subscribePush));
router.post('/unsubscribe', asyncHandler(notificationController.unsubscribePush));
router.get('/vapid-key', asyncHandler(notificationController.getVapidKey));
router.post('/test-push', asyncHandler(notificationController.sendTestPush));

// Mark as read
router.put('/:id/read', asyncHandler(notificationController.markAsRead));

// Mark all as read
router.put('/mark-all-read', asyncHandler(notificationController.markAllAsRead));

// Delete notification
router.delete('/:id', asyncHandler(notificationController.deleteNotification));

// Clear all
router.delete('/', asyncHandler(notificationController.clearAll));

module.exports = router;
