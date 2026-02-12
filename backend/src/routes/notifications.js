const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticate);

// Get notifications
router.get('/', notificationController.getNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Get preferences
router.get('/preferences', notificationController.getPreferences);

// Update preferences
router.put('/preferences', notificationController.updatePreferences);

// Push notification subscription
router.post('/subscribe', notificationController.subscribePush);
router.post('/unsubscribe', notificationController.unsubscribePush);
router.get('/vapid-key', notificationController.getVapidKey);
router.post('/test-push', notificationController.sendTestPush);

// Mark as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Clear all
router.delete('/', notificationController.clearAll);

module.exports = router;
