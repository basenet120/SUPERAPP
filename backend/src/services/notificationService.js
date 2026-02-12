const Notification = require('../models/Notification');
const emailService = require('./emailService');
const webpush = require('web-push');
const logger = require('../utils/logger');

// VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@baseapp.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

class NotificationService {
  // Main method to send a notification
  async send(userId, type, data) {
    try {
      const { title, message, priority = 'normal', url, metadata = {} } = data;
      
      // Create notification in database
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        priority,
        data: { url, ...metadata }
      });

      // Send in-app notification via socket
      await this.sendInApp(userId, notification);

      // Send email if enabled
      await this.sendEmail(userId, type, { title, message, url, priority });

      // Send push notification if enabled
      await this.sendPush(userId, type, { title, message, url, priority });

      return notification;
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send in-app notification via socket.io
  async sendInApp(userId, notification) {
    const shouldSend = await Notification.shouldSend(userId, notification.type, 'inapp');
    if (!shouldSend) return;

    // Get the io instance from the app
    const { getIo } = require('../server');
    const io = getIo ? getIo() : null;
    
    if (io) {
      io.to(`user:${userId}`).emit('notification', notification);
    }
  }

  // Send email notification
  async sendEmail(userId, type, data) {
    const shouldSend = await Notification.shouldSend(userId, type, 'email');
    if (!shouldSend) return;

    const { title, message, url } = data;

    try {
      // Get user email
      const knex = require('../config/database');
      const user = await knex('users').where('id', userId).first();
      
      if (!user) return;

      // Send email using email service
      await emailService.send({
        to: user.email,
        subject: title,
        template: 'notification',
        data: {
          title,
          message,
          url,
          firstName: user.first_name
        }
      });

      // Mark as email sent
      await knex('notifications')
        .where('id', notification.id)
        .update({ email_sent: true, email_sent_at: knex.fn.now() });
    } catch (error) {
      logger.error('Error sending email notification:', error);
    }
  }

  // Send push notification
  async sendPush(userId, type, data) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

    const shouldSend = await Notification.shouldSend(userId, type, 'push');
    if (!shouldSend) return;

    try {
      const subscriptions = await Notification.getPushSubscriptions(userId);
      if (!subscriptions.length) return;

      const { title, message, url, priority } = data;
      
      const payload = JSON.stringify({
        title,
        body: message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: type,
        requireInteraction: priority === 'high' || priority === 'urgent',
        data: { url, type }
      });

      const results = await Promise.allSettled(
        subscriptions.map(sub => 
          webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: sub.keys
          }, payload)
        )
      );

      // Remove invalid subscriptions
      const invalidEndpoints = results
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => result.status === 'rejected' && result.reason.statusCode === 410)
        .map(({ index }) => subscriptions[index].endpoint);

      for (const endpoint of invalidEndpoints) {
        await Notification.deletePushSubscription(userId, endpoint);
      }

      logger.info(`Push notification sent to ${userId}: ${results.filter(r => r.status === 'fulfilled').length} successful`);
    } catch (error) {
      logger.error('Error sending push notification:', error);
    }
  }

  // Send booking confirmation notification
  async bookingConfirmed(userId, bookingData) {
    return this.send(userId, 'booking_confirmed', {
      title: 'Booking Confirmed',
      message: `Your booking for ${bookingData.studioName} on ${bookingData.date} has been confirmed.`,
      priority: 'normal',
      url: `/bookings/${bookingData.id}`,
      metadata: { bookingId: bookingData.id }
    });
  }

  // Send booking cancelled notification
  async bookingCancelled(userId, bookingData) {
    return this.send(userId, 'booking_cancelled', {
      title: 'Booking Cancelled',
      message: `Your booking for ${bookingData.studioName} on ${bookingData.date} has been cancelled.`,
      priority: 'high',
      url: `/bookings/${bookingData.id}`,
      metadata: { bookingId: bookingData.id }
    });
  }

  // Send payment received notification
  async paymentReceived(userId, paymentData) {
    return this.send(userId, 'payment_received', {
      title: 'Payment Received',
      message: `Payment of $${paymentData.amount} for booking #${paymentData.bookingId} has been received.`,
      priority: 'normal',
      url: `/bookings/${paymentData.bookingId}`,
      metadata: { paymentId: paymentData.id, amount: paymentData.amount }
    });
  }

  // Send payment failed notification
  async paymentFailed(userId, paymentData) {
    return this.send(userId, 'payment_failed', {
      title: 'Payment Failed',
      message: `Payment of $${paymentData.amount} for booking #${paymentData.bookingId} failed. Please update your payment method.`,
      priority: 'high',
      url: `/bookings/${paymentData.bookingId}/payment`,
      metadata: { paymentId: paymentData.id }
    });
  }

  // Send COI uploaded notification
  async coiUploaded(userId, coiData) {
    return this.send(userId, 'coi_uploaded', {
      title: 'Certificate of Insurance Uploaded',
      message: `COI for ${coiData.projectName} has been uploaded and is pending approval.`,
      priority: 'normal',
      url: `/projects/${coiData.projectId}/documents`,
      metadata: { documentId: coiData.id }
    });
  }

  // Send quote approved notification
  async quoteApproved(userId, quoteData) {
    return this.send(userId, 'quote_approved', {
      title: 'Quote Approved',
      message: `Your quote for $${quoteData.total} has been approved by ${quoteData.clientName}.`,
      priority: 'high',
      url: `/quotes/${quoteData.id}`,
      metadata: { quoteId: quoteData.id, total: quoteData.total }
    });
  }

  // Send quote declined notification
  async quoteDeclined(userId, quoteData) {
    return this.send(userId, 'quote_declined', {
      title: 'Quote Declined',
      message: `Your quote for $${quoteData.total} has been declined by ${quoteData.clientName}.`,
      priority: 'high',
      url: `/quotes/${quoteData.id}`,
      metadata: { quoteId: quoteData.id }
    });
  }

  // Send equipment conflict notification
  async equipmentConflict(userId, conflictData) {
    return this.send(userId, 'equipment_conflict', {
      title: 'Equipment Conflict',
      message: `Equipment ${conflictData.equipmentName} has a scheduling conflict on ${conflictData.date}.`,
      priority: 'urgent',
      url: `/equipment/calendar?date=${conflictData.date}`,
      metadata: { equipmentId: conflictData.equipmentId }
    });
  }

  // Send mention notification
  async mention(userId, mentionData) {
    return this.send(userId, 'mention', {
      title: 'New Mention',
      message: `${mentionData.mentionedBy} mentioned you in ${mentionData.context}`,
      priority: 'normal',
      url: mentionData.url,
      metadata: { channelId: mentionData.channelId, messageId: mentionData.messageId }
    });
  }

  // Send system alert
  async systemAlert(userId, alertData) {
    return this.send(userId, 'system_alert', {
      title: alertData.title || 'System Alert',
      message: alertData.message,
      priority: alertData.priority || 'high',
      url: alertData.url,
      metadata: alertData.metadata || {}
    });
  }

  // Send daily digest
  async sendDailyDigest(userId) {
    const notifications = await Notification.getForDigest(userId, 'daily');
    if (!notifications.length) return;

    const knex = require('../config/database');
    const user = await knex('users').where('id', userId).first();
    
    if (!user) return;

    await emailService.send({
      to: user.email,
      subject: 'Your Daily Summary',
      template: 'daily-digest',
      data: {
        firstName: user.first_name,
        notificationCount: notifications.length,
        notifications: notifications.slice(0, 10),
        date: new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      }
    });
  }

  // Send weekly digest
  async sendWeeklyDigest(userId) {
    const notifications = await Notification.getForDigest(userId, 'weekly');
    if (!notifications.length) return;

    const knex = require('../config/database');
    const user = await knex('users').where('id', userId).first();
    
    if (!user) return;

    await emailService.send({
      to: user.email,
      subject: 'Your Weekly Summary',
      template: 'weekly-digest',
      data: {
        firstName: user.first_name,
        notificationCount: notifications.length,
        notifications: notifications.slice(0, 20),
        weekRange: this.getWeekRange()
      }
    });
  }

  getWeekRange() {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    
    const format = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${format(start)} - ${format(now)}`;
  }
}

module.exports = new NotificationService();
