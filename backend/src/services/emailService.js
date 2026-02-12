const sgMail = require('@sendgrid/mail');
const AWS = require('aws-sdk');
const db = require('../config/database');
const config = require('../config');
const logger = require('../utils/logger');

// Configure SendGrid
if (config.email.sendgridApiKey) {
  sgMail.setApiKey(config.email.sendgridApiKey);
}

// Configure SES
const ses = new AWS.SES({
  accessKeyId: config.email.aws.accessKeyId,
  secretAccessKey: config.email.aws.secretAccessKey,
  region: config.email.aws.region
});

class EmailService {
  constructor() {
    this.provider = 'sendgrid'; // primary provider
    this.fallbackProvider = 'ses';
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content
   * @param {string} options.templateId - Template ID (optional)
   * @param {Object} options.templateData - Template data (optional)
   * @returns {Promise<Object>} Send result
   */
  async send(options) {
    const { to, subject, html, text, templateId, templateData } = options;

    // Log email to database
    const [emailLog] = await db('sent_emails')
      .insert({
        to_email: to,
        to_name: options.toName,
        from_email: config.email.from,
        from_name: config.email.fromName,
        subject,
        body_html: html,
        body_text: text,
        template_id: templateId,
        template_data: templateData ? JSON.stringify(templateData) : null,
        status: 'queued',
        provider: this.provider
      })
      .returning('*');

    try {
      let result;

      if (this.provider === 'sendgrid' && config.email.sendgridApiKey) {
        result = await this.sendWithSendGrid({
          to,
          subject,
          html,
          text,
          templateId,
          templateData
        });
      } else if (this.provider === 'ses') {
        result = await this.sendWithSES({
          to,
          subject,
          html,
          text
        });
      } else {
        throw new Error('No email provider configured');
      }

      // Update log
      await db('sent_emails')
        .where({ id: emailLog.id })
        .update({
          status: 'sent',
          sent_at: new Date(),
          provider_message_id: result.messageId
        });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Email send error:', error);

      // Try fallback
      if (this.fallbackProvider && this.fallbackProvider !== this.provider) {
        try {
          const fallbackResult = await this.sendWithSES({ to, subject, html, text });
          
          await db('sent_emails')
            .where({ id: emailLog.id })
            .update({
              status: 'sent',
              sent_at: new Date(),
              provider: this.fallbackProvider,
              provider_message_id: fallbackResult.messageId
            });

          return { success: true, messageId: fallbackResult.messageId };
        } catch (fallbackError) {
          logger.error('Fallback email send error:', fallbackError);
        }
      }

      // Update log with error
      await db('sent_emails')
        .where({ id: emailLog.id })
        .update({
          status: 'failed',
          error_message: error.message
        });

      throw error;
    }
  }

  /**
   * Send using SendGrid
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result
   */
  async sendWithSendGrid(options) {
    const msg = {
      to: options.to,
      from: {
        email: config.email.from,
        name: config.email.fromName
      },
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    if (options.templateId) {
      msg.templateId = options.templateId;
      msg.dynamicTemplateData = options.templateData;
    }

    const result = await sgMail.send(msg);
    return { messageId: result[0].headers['x-message-id'] };
  }

  /**
   * Send using AWS SES
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result
   */
  async sendWithSES(options) {
    const params = {
      Source: `${config.email.fromName} <${config.email.from}>`,
      Destination: {
        ToAddresses: [options.to]
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8'
        },
        Body: {}
      }
    };

    if (options.html) {
      params.Message.Body.Html = {
        Data: options.html,
        Charset: 'UTF-8'
      };
    }

    if (options.text) {
      params.Message.Body.Text = {
        Data: options.text,
        Charset: 'UTF-8'
      };
    }

    const result = await ses.sendEmail(params).promise();
    return { messageId: result.MessageId };
  }

  /**
   * Send templated email
   * @param {string} templateSlug - Template slug
   * @param {string} to - Recipient email
   * @param {Object} data - Template data
   * @returns {Promise<Object>} Send result
   */
  async sendTemplate(templateSlug, to, data) {
    const template = await db('email_templates')
      .where({ slug: templateSlug, active: true })
      .first();

    if (!template) {
      throw new Error(`Template ${templateSlug} not found`);
    }

    // Replace variables in template
    let subject = template.subject;
    let html = template.body_html;
    let text = template.body_text;

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
      if (text) text = text.replace(regex, value);
    }

    return this.send({
      to,
      subject,
      html,
      text,
      templateId: template.id,
      templateData: data
    });
  }

  /**
   * Send booking confirmation email
   * @param {Object} booking - Booking data
   * @returns {Promise<Object>} Send result
   */
  async sendBookingConfirmation(booking) {
    return this.sendTemplate('booking_confirmation', booking.client_email, {
      bookingNumber: booking.booking_number,
      clientName: booking.client_name,
      pickupDate: new Date(booking.pickup_datetime).toLocaleDateString(),
      returnDate: new Date(booking.return_datetime).toLocaleDateString(),
      totalAmount: booking.total_amount.toFixed(2),
      items: booking.items.map(i => i.equipment_name).join(', ')
    });
  }

  /**
   * Send COI reminder email
   * @param {Object} booking - Booking data
   * @returns {Promise<Object>} Send result
   */
  async sendCOIReminder(booking) {
    return this.sendTemplate('coi_reminder', booking.email, {
      bookingNumber: booking.booking_number,
      clientName: booking.contact_name,
      uploadUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}/upload-coi`
    });
  }

  /**
   * Send payment reminder email
   * @param {Object} booking - Booking data
   * @returns {Promise<Object>} Send result
   */
  async sendPaymentReminder(booking) {
    return this.sendTemplate('payment_reminder', booking.email, {
      bookingNumber: booking.booking_number,
      clientName: booking.contact_name,
      balanceDue: booking.balance_due.toFixed(2),
      paymentDueDate: new Date(booking.payment_due_date).toLocaleDateString(),
      paymentUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}/pay`
    });
  }

  /**
   * Send pre-shoot reminder
   * @param {Object} booking - Booking data
   * @returns {Promise<Object>} Send result
   */
  async sendPreShootReminder(booking) {
    return this.sendTemplate('pre_shoot_reminder', booking.email, {
      bookingNumber: booking.booking_number,
      clientName: booking.contact_name,
      pickupDate: new Date(booking.pickup_datetime).toLocaleString(),
      pickupLocation: booking.pickup_location,
      items: booking.items?.map(i => i.equipment_name).join(', ')
    });
  }

  /**
   * Send post-shoot follow-up
   * @param {Object} booking - Booking data
   * @returns {Promise<Object>} Send result
   */
  async sendPostShootFollowUp(booking) {
    return this.sendTemplate('post_shoot_follow_up', booking.email, {
      bookingNumber: booking.booking_number,
      clientName: booking.contact_name,
      reviewUrl: `${process.env.FRONTEND_URL}/review/${booking.id}`
    });
  }
}

module.exports = new EmailService();
