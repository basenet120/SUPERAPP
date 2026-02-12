const cron = require('node-cron');
const BookingModel = require('../models/Booking');
const emailService = require('./emailService');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Booking Email Automation Job
 * 
 * Handles automated email reminders:
 * - COI reminder: 24hrs after quote if not submitted
 * - Payment reminder: 48hrs before deadline
 * - Confirmation emails on booking
 * - Pre-shoot reminder: 24hrs before pickup
 * - Post-shoot follow-up: 24hrs after return
 */
class BookingEmailAutomation {
  constructor() {
    this.running = false;
  }

  /**
   * Start the automation job
   */
  start() {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
      logger.info('Running booking email automation...');
      await this.processReminders();
    });

    logger.info('Booking email automation started');
  }

  /**
   * Process all reminder types
   */
  async processReminders() {
    try {
      await Promise.all([
        this.processCOIReminders(),
        this.processPaymentReminders(),
        this.processPreShootReminders(),
        this.processPostShootFollowUps()
      ]);
    } catch (error) {
      logger.error('Error in booking email automation:', error);
    }
  }

  /**
   * Process COI reminders (24hrs after quote sent)
   */
  async processCOIReminders() {
    const bookings = await BookingModel.getCOIReminderBookings(24);

    for (const booking of bookings) {
      try {
        // Check if reminder already sent
        const existing = await db('booking_reminders')
          .where({
            booking_id: booking.id,
            type: 'coi_reminder'
          })
          .first();

        if (existing) continue;

        // Send reminder
        await emailService.sendCOIReminder(booking);

        // Log reminder
        await db('booking_reminders').insert({
          booking_id: booking.id,
          type: 'coi_reminder',
          scheduled_at: new Date(),
          sent_at: new Date(),
          status: 'sent'
        });

        logger.info(`COI reminder sent for booking ${booking.booking_number}`);
      } catch (error) {
        logger.error(`Failed to send COI reminder for booking ${booking.id}:`, error);
      }
    }
  }

  /**
   * Process payment reminders (48hrs before due date)
   */
  async processPaymentReminders() {
    const bookings = await BookingModel.getPaymentReminderBookings(48);

    for (const booking of bookings) {
      try {
        // Check if reminder already sent
        const existing = await db('booking_reminders')
          .where({
            booking_id: booking.id,
            type: 'payment_reminder'
          })
          .first();

        if (existing) continue;

        await emailService.sendPaymentReminder(booking);

        await db('booking_reminders').insert({
          booking_id: booking.id,
          type: 'payment_reminder',
          scheduled_at: new Date(),
          sent_at: new Date(),
          status: 'sent'
        });

        logger.info(`Payment reminder sent for booking ${booking.booking_number}`);
      } catch (error) {
        logger.error(`Failed to send payment reminder for booking ${booking.id}:`, error);
      }
    }
  }

  /**
   * Process pre-shoot reminders (24hrs before pickup)
   */
  async processPreShootReminders() {
    const bookings = await BookingModel.getUpcomingBookings(24);

    for (const booking of bookings) {
      try {
        // Check if reminder already sent
        const existing = await db('booking_reminders')
          .where({
            booking_id: booking.id,
            type: 'pre_shoot'
          })
          .first();

        if (existing) continue;

        // Load items
        const items = await BookingModel.getItems(booking.id);
        booking.items = items;

        await emailService.sendPreShootReminder(booking);

        await db('booking_reminders').insert({
          booking_id: booking.id,
          type: 'pre_shoot',
          scheduled_at: new Date(),
          sent_at: new Date(),
          status: 'sent'
        });

        logger.info(`Pre-shoot reminder sent for booking ${booking.booking_number}`);
      } catch (error) {
        logger.error(`Failed to send pre-shoot reminder for booking ${booking.id}:`, error);
      }
    }
  }

  /**
   * Process post-shoot follow-ups (24hrs after return)
   */
  async processPostShootFollowUps() {
    const bookings = await BookingModel.getCompletedBookingsForFollowUp(24);

    for (const booking of bookings) {
      try {
        // Check if follow-up already sent
        const existing = await db('booking_reminders')
          .where({
            booking_id: booking.id,
            type: 'post_shoot'
          })
          .first();

        if (existing) continue;

        await emailService.sendPostShootFollowUp(booking);

        await db('booking_reminders').insert({
          booking_id: booking.id,
          type: 'post_shoot',
          scheduled_at: new Date(),
          sent_at: new Date(),
          status: 'sent'
        });

        logger.info(`Post-shoot follow-up sent for booking ${booking.booking_number}`);
      } catch (error) {
        logger.error(`Failed to send post-shoot follow-up for booking ${booking.id}:`, error);
      }
    }
  }

  /**
   * Schedule confirmation email for new booking
   * @param {string} bookingId - Booking ID
   */
  async scheduleConfirmation(bookingId) {
    try {
      const booking = await BookingModel.findById(bookingId);
      if (!booking) return;

      await emailService.sendBookingConfirmation(booking);

      await db('booking_reminders').insert({
        booking_id: bookingId,
        type: 'confirmation',
        scheduled_at: new Date(),
        sent_at: new Date(),
        status: 'sent'
      });

      logger.info(`Confirmation sent for booking ${booking.booking_number}`);
    } catch (error) {
      logger.error(`Failed to send confirmation for booking ${bookingId}:`, error);
    }
  }
}

module.exports = new BookingEmailAutomation();
