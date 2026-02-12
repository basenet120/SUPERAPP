const Notification = require('../models/Notification');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const webpush = require('web-push');

// VAPID keys for push notifications
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@baseapp.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

class NotificationController {
  // Get user's notifications
  async getNotifications(req, res) {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const notifications = await Notification.getForUser(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });
    
    const unreadCount = await Notification.getUnreadCount(userId);
    
    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notifications.length
      }
    });
  }

  // Get unread count
  async getUnreadCount(req, res) {
    const userId = req.user.id;
    const count = await Notification.getUnreadCount(userId);
    res.json({ count });
  }

  // Mark notification as read
  async markAsRead(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    
    const notification = await Notification.markAsRead(id, userId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    
    res.json(notification);
  }

  // Mark all as read
  async markAllAsRead(req, res) {
    const userId = req.user.id;
    const count = await Notification.markAllAsRead(userId);
    res.json({ markedAsRead: count });
  }

  // Delete notification
  async deleteNotification(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    
    const deleted = await Notification.delete(id, userId);
    if (!deleted) {
      throw new NotFoundError('Notification not found');
    }
    
    res.json({ success: true });
  }

  // Clear all notifications
  async clearAll(req, res) {
    const userId = req.user.id;
    const count = await Notification.clearAll(userId);
    res.json({ deleted: count });
  }

  // Get notification preferences
  async getPreferences(req, res) {
    const userId = req.user.id;
    const preferences = await Notification.getPreferences(userId);
    res.json(preferences);
  }

  // Update notification preferences
  async updatePreferences(req, res) {
    const userId = req.user.id;
    const updates = req.body;
    
    const preferences = await Notification.updatePreferences(userId, updates);
    res.json(preferences);
  }

  // Subscribe to push notifications
  async subscribePush(req, res) {
    const userId = req.user.id;
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      throw new BadRequestError('Invalid subscription data');
    }
    
    await Notification.savePushSubscription(userId, {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      user_agent: req.headers['user-agent']
    });
    
    res.json({ success: true });
  }

  // Unsubscribe from push notifications
  async unsubscribePush(req, res) {
    const userId = req.user.id;
    const { endpoint } = req.body;
    
    await Notification.deletePushSubscription(userId, endpoint);
    res.json({ success: true });
  }

  // Get VAPID public key
  async getVapidKey(req, res) {
    res.json({ 
      publicKey: VAPID_PUBLIC_KEY,
      enabled: !!VAPID_PUBLIC_KEY
    });
  }

  // Create notification (internal use)
  async createNotification(req, res) {
    // This endpoint is typically called internally or by admin
    const notification = await Notification.create(req.body);
    res.status(201).json(notification);
  }

  // Send test push notification
  async sendTestPush(req, res) {
    const userId = req.user.id;
    
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new BadRequestError('Push notifications not configured');
    }
    
    const subscriptions = await Notification.getPushSubscriptions(userId);
    
    const payload = JSON.stringify({
      title: 'Test Notification',
      body: 'This is a test push notification from Base Super App',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test',
      requireInteraction: true,
      data: {
        url: '/dashboard',
        type: 'test'
      }
    });
    
    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: sub.keys
        }, payload)
      )
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    res.json({ 
      success: true, 
      sent: successful, 
      failed,
      total: subscriptions.length 
    });
  }
}

module.exports = new NotificationController();
