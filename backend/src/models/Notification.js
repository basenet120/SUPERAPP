const knex = require('../config/database');

class Notification {
  // Create a new notification
  static async create(data) {
    const [notification] = await knex('notifications')
      .insert({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: JSON.stringify(data.data || {}),
        priority: data.priority || 'normal'
      })
      .returning('*');
    
    return this.formatNotification(notification);
  }

  // Get notifications for user
  static async getForUser(userId, options = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    
    let query = knex('notifications')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);
    
    if (unreadOnly) {
      query = query.where('read', false);
    }
    
    const notifications = await query;
    return notifications.map(n => this.formatNotification(n));
  }

  // Get unread count
  static async getUnreadCount(userId) {
    const result = await knex('notifications')
      .where('user_id', userId)
      .where('read', false)
      .count('id as count')
      .first();
    
    return parseInt(result.count);
  }

  // Mark as read
  static async markAsRead(id, userId) {
    const [notification] = await knex('notifications')
      .where({ id, user_id: userId })
      .update({
        read: true,
        read_at: knex.fn.now()
      })
      .returning('*');
    
    return notification ? this.formatNotification(notification) : null;
  }

  // Mark all as read
  static async markAllAsRead(userId) {
    const result = await knex('notifications')
      .where({ user_id: userId, read: false })
      .update({
        read: true,
        read_at: knex.fn.now()
      });
    
    return result;
  }

  // Delete notification
  static async delete(id, userId) {
    const result = await knex('notifications')
      .where({ id, user_id: userId })
      .delete();
    
    return result > 0;
  }

  // Clear all notifications
  static async clearAll(userId) {
    const result = await knex('notifications')
      .where('user_id', userId)
      .delete();
    
    return result;
  }

  // Get or create preferences
  static async getPreferences(userId) {
    let prefs = await knex('notification_preferences')
      .where('user_id', userId)
      .first();
    
    if (!prefs) {
      [prefs] = await knex('notification_preferences')
        .insert({ user_id: userId })
        .returning('*');
    }
    
    return this.formatPreferences(prefs);
  }

  // Update preferences
  static async updatePreferences(userId, updates) {
    const allowedFields = [
      'inapp_booking_confirmed', 'inapp_booking_cancelled', 'inapp_payment_received',
      'inapp_payment_failed', 'inapp_coi_uploaded', 'inapp_quote_approved',
      'inapp_quote_declined', 'inapp_equipment_conflict', 'inapp_mention', 'inapp_system_alert',
      'email_booking_confirmed', 'email_booking_cancelled', 'email_payment_received',
      'email_payment_failed', 'email_coi_uploaded', 'email_quote_approved',
      'email_quote_declined', 'email_equipment_conflict', 'email_mention', 'email_system_alert',
      'push_booking_confirmed', 'push_booking_cancelled', 'push_payment_received',
      'push_payment_failed', 'push_coi_uploaded', 'push_quote_approved',
      'push_quote_declined', 'push_equipment_conflict', 'push_mention', 'push_system_alert',
      'digest_daily_enabled', 'digest_daily_time', 'digest_weekly_enabled',
      'digest_weekly_day', 'digest_weekly_time', 'quiet_hours_enabled',
      'quiet_hours_start', 'quiet_hours_end', 'quiet_hours_timezone'
    ];
    
    const filteredUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }
    
    // Ensure user has preferences record
    const exists = await knex('notification_preferences')
      .where('user_id', userId)
      .first();
    
    if (!exists) {
      await knex('notification_preferences').insert({ user_id: userId });
    }
    
    const [prefs] = await knex('notification_preferences')
      .where('user_id', userId)
      .update({ ...filteredUpdates, updated_at: knex.fn.now() })
      .returning('*');
    
    return this.formatPreferences(prefs);
  }

  // Save push subscription
  static async savePushSubscription(userId, data) {
    const exists = await knex('push_subscriptions')
      .where({ user_id: userId, endpoint: data.endpoint })
      .first();
    
    if (exists) {
      await knex('push_subscriptions')
        .where({ id: exists.id })
        .update({
          keys: JSON.stringify(data.keys),
          user_agent: data.user_agent,
          last_used: knex.fn.now(),
          updated_at: knex.fn.now()
        });
    } else {
      await knex('push_subscriptions').insert({
        user_id: userId,
        endpoint: data.endpoint,
        keys: JSON.stringify(data.keys),
        user_agent: data.user_agent,
        last_used: knex.fn.now()
      });
    }
  }

  // Delete push subscription
  static async deletePushSubscription(userId, endpoint) {
    await knex('push_subscriptions')
      .where({ user_id: userId, endpoint })
      .delete();
  }

  // Get push subscriptions for user
  static async getPushSubscriptions(userId) {
    const subs = await knex('push_subscriptions')
      .where('user_id', userId)
      .whereRaw('last_used > NOW() - INTERVAL \'30 days\'');
    
    return subs.map(s => ({
      ...s,
      keys: typeof s.keys === 'string' ? JSON.parse(s.keys) : s.keys
    }));
  }

  // Check if notification should be sent based on preferences and quiet hours
  static async shouldSend(userId, type, channel) {
    const prefs = await this.getPreferences(userId);
    
    // Check if channel is enabled for this type
    const prefKey = `${channel}_${type}`;
    if (prefs[prefKey] === false) {
      return false;
    }
    
    // Check quiet hours for push notifications
    if (channel === 'push' && prefs.quiet_hours_enabled) {
      const now = new Date();
      const timezone = prefs.quiet_hours_timezone;
      
      // Convert current time to user's timezone
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const currentHour = userTime.getHours();
      const currentMinute = userTime.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      // Parse quiet hours
      const [startHour, startMinute] = prefs.quiet_hours_start.split(':').map(Number);
      const [endHour, endMinute] = prefs.quiet_hours_end.split(':').map(Number);
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      // Check if current time is within quiet hours
      if (startTime < endTime) {
        // Same day range (e.g., 22:00 - 08:00 next day doesn't apply here)
        if (currentTime >= startTime && currentTime <= endTime) {
          return false;
        }
      } else {
        // Overnight range (e.g., 22:00 - 08:00)
        if (currentTime >= startTime || currentTime <= endTime) {
          return false;
        }
      }
    }
    
    return true;
  }

  // Get notifications for digest
  static async getForDigest(userId, type) {
    let startTime;
    const now = new Date();
    
    if (type === 'daily') {
      startTime = new Date(now - 24 * 60 * 60 * 1000);
    } else if (type === 'weekly') {
      startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
    
    const notifications = await knex('notifications')
      .where('user_id', userId)
      .where('created_at', '>=', startTime)
      .where('read', false)
      .orderBy('created_at', 'desc');
    
    return notifications.map(n => this.formatNotification(n));
  }

  // Format notification for output
  static formatNotification(notification) {
    return {
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: typeof notification.data === 'string' 
        ? JSON.parse(notification.data) 
        : notification.data,
      priority: notification.priority,
      read: notification.read,
      readAt: notification.read_at,
      emailSent: notification.email_sent,
      pushSent: notification.push_sent,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at
    };
  }

  // Format preferences for output
  static formatPreferences(prefs) {
    return {
      id: prefs.id,
      userId: prefs.user_id,
      // In-app
      inapp_booking_confirmed: prefs.inapp_booking_confirmed,
      inapp_booking_cancelled: prefs.inapp_booking_cancelled,
      inapp_payment_received: prefs.inapp_payment_received,
      inapp_payment_failed: prefs.inapp_payment_failed,
      inapp_coi_uploaded: prefs.inapp_coi_uploaded,
      inapp_quote_approved: prefs.inapp_quote_approved,
      inapp_quote_declined: prefs.inapp_quote_declined,
      inapp_equipment_conflict: prefs.inapp_equipment_conflict,
      inapp_mention: prefs.inapp_mention,
      inapp_system_alert: prefs.inapp_system_alert,
      // Email
      email_booking_confirmed: prefs.email_booking_confirmed,
      email_booking_cancelled: prefs.email_booking_cancelled,
      email_payment_received: prefs.email_payment_received,
      email_payment_failed: prefs.email_payment_failed,
      email_coi_uploaded: prefs.email_coi_uploaded,
      email_quote_approved: prefs.email_quote_approved,
      email_quote_declined: prefs.email_quote_declined,
      email_equipment_conflict: prefs.email_equipment_conflict,
      email_mention: prefs.email_mention,
      email_system_alert: prefs.email_system_alert,
      // Push
      push_booking_confirmed: prefs.push_booking_confirmed,
      push_booking_cancelled: prefs.push_booking_cancelled,
      push_payment_received: prefs.push_payment_received,
      push_payment_failed: prefs.push_payment_failed,
      push_coi_uploaded: prefs.push_coi_uploaded,
      push_quote_approved: prefs.push_quote_approved,
      push_quote_declined: prefs.push_quote_declined,
      push_equipment_conflict: prefs.push_equipment_conflict,
      push_mention: prefs.push_mention,
      push_system_alert: prefs.push_system_alert,
      // Digest
      digest_daily_enabled: prefs.digest_daily_enabled,
      digest_daily_time: prefs.digest_daily_time,
      digest_weekly_enabled: prefs.digest_weekly_enabled,
      digest_weekly_day: prefs.digest_weekly_day,
      digest_weekly_time: prefs.digest_weekly_time,
      // Quiet hours
      quiet_hours_enabled: prefs.quiet_hours_enabled,
      quiet_hours_start: prefs.quiet_hours_start,
      quiet_hours_end: prefs.quiet_hours_end,
      quiet_hours_timezone: prefs.quiet_hours_timezone,
      createdAt: prefs.created_at,
      updatedAt: prefs.updated_at
    };
  }
}

module.exports = Notification;
