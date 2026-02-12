exports.up = async function(knex) {
  // Email Templates
  await knex.schema.createTable('email_templates', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('slug').unique().notNullable();
    table.string('subject').notNullable();
    table.text('body_html').notNullable();
    table.text('body_text');
    table.enum('category', [
      'transactional', 'marketing', 'notification', 'booking', 'system'
    ]).defaultTo('transactional');
    table.jsonb('variables').defaultTo('[]');
    table.boolean('is_default').defaultTo(false);
    table.boolean('active').defaultTo(true);
    table.uuid('created_by').references('id').inTable('users');
    table.timestamps(true, true);
  });

  // Sent Emails Log
  await knex.schema.createTable('sent_emails', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('template_id').references('id').inTable('email_templates');
    table.string('to_email').notNullable();
    table.string('to_name');
    table.string('from_email').notNullable();
    table.string('from_name');
    table.string('subject').notNullable();
    table.text('body_html');
    table.text('body_text');
    table.jsonb('template_data');
    table.enum('status', ['queued', 'sending', 'sent', 'delivered', 'bounced', 'failed', 'opened', 'clicked'])
      .defaultTo('queued');
    table.string('provider'); // sendgrid, ses, etc.
    table.string('provider_message_id');
    table.text('error_message');
    table.integer('retry_count').defaultTo(0);
    table.timestamp('sent_at');
    table.timestamp('delivered_at');
    table.timestamp('opened_at');
    table.timestamp('clicked_at');
    table.string('ip_address');
    table.string('user_agent');
    table.timestamps(true, true);
    table.index(['to_email', 'created_at']);
    table.index(['status']);
  });

  // Email Campaigns
  await knex.schema.createTable('email_campaigns', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.text('description');
    table.uuid('template_id').references('id').inTable('email_templates');
    table.enum('status', ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'])
      .defaultTo('draft');
    table.timestamp('scheduled_at');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.jsonb('segment_criteria').defaultTo('{}');
    table.integer('recipient_count').defaultTo(0);
    table.integer('sent_count').defaultTo(0);
    table.integer('open_count').defaultTo(0);
    table.integer('click_count').defaultTo(0);
    table.integer('bounce_count').defaultTo(0);
    table.uuid('created_by').references('id').inTable('users');
    table.timestamps(true, true);
  });

  // SMS Messages
  await knex.schema.createTable('sms_messages', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users');
    table.string('to_phone').notNullable();
    table.string('from_phone').notNullable();
    table.text('body').notNullable();
    table.enum('status', ['queued', 'sending', 'sent', 'delivered', 'failed'])
      .defaultTo('queued');
    table.string('provider');
    table.string('provider_message_id');
    table.text('error_message');
    table.timestamp('sent_at');
    table.timestamp('delivered_at');
    table.timestamps(true, true);
  });

  // Notification Preferences
  await knex.schema.createTable('notification_settings', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
    table.boolean('email_booking_updates').defaultTo(true);
    table.boolean('email_marketing').defaultTo(false);
    table.boolean('email_digest_daily').defaultTo(true);
    table.boolean('sms_urgent').defaultTo(true);
    table.boolean('sms_booking_reminders').defaultTo(false);
    table.boolean('push_notifications').defaultTo(true);
    table.boolean('chat_notifications').defaultTo(true);
    table.boolean('mention_notifications').defaultTo(true);
    table.jsonb('custom_settings').defaultTo('{}');
    table.timestamps(true, true);
  });

  // Webhook Events (for external integrations)
  await knex.schema.createTable('webhook_events', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('event_type').notNullable();
    table.string('source').notNullable(); // quickbooks, stripe, etc.
    table.jsonb('payload').notNullable();
    table.enum('status', ['pending', 'processing', 'completed', 'failed', 'retrying'])
      .defaultTo('pending');
    table.text('error_message');
    table.integer('retry_count').defaultTo(0);
    table.timestamp('processed_at');
    table.timestamps(true, true);
    table.index(['event_type', 'status']);
    table.index(['created_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('webhook_events');
  await knex.schema.dropTableIfExists('notification_settings');
  await knex.schema.dropTableIfExists('sms_messages');
  await knex.schema.dropTableIfExists('email_campaigns');
  await knex.schema.dropTableIfExists('sent_emails');
  await knex.schema.dropTableIfExists('email_templates');
};
