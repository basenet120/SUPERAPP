exports.up = async function(knex) {
  // Notification preferences table (new)
  await knex.schema.createTable('notification_preferences', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
    
    // In-app notifications
    table.boolean('inapp_booking_confirmed').defaultTo(true);
    table.boolean('inapp_booking_cancelled').defaultTo(true);
    table.boolean('inapp_payment_received').defaultTo(true);
    table.boolean('inapp_payment_failed').defaultTo(true);
    table.boolean('inapp_coi_uploaded').defaultTo(true);
    table.boolean('inapp_quote_approved').defaultTo(true);
    table.boolean('inapp_quote_declined').defaultTo(true);
    table.boolean('inapp_equipment_conflict').defaultTo(true);
    table.boolean('inapp_mention').defaultTo(true);
    table.boolean('inapp_system_alert').defaultTo(true);
    
    // Email notifications
    table.boolean('email_booking_confirmed').defaultTo(true);
    table.boolean('email_booking_cancelled').defaultTo(true);
    table.boolean('email_payment_received').defaultTo(true);
    table.boolean('email_payment_failed').defaultTo(true);
    table.boolean('email_coi_uploaded').defaultTo(false);
    table.boolean('email_quote_approved').defaultTo(true);
    table.boolean('email_quote_declined').defaultTo(true);
    table.boolean('email_equipment_conflict').defaultTo(true);
    table.boolean('email_mention').defaultTo(true);
    table.boolean('email_system_alert').defaultTo(true);
    
    // Push notifications
    table.boolean('push_booking_confirmed').defaultTo(true);
    table.boolean('push_booking_cancelled').defaultTo(true);
    table.boolean('push_payment_received').defaultTo(true);
    table.boolean('push_payment_failed').defaultTo(true);
    table.boolean('push_coi_uploaded').defaultTo(false);
    table.boolean('push_quote_approved').defaultTo(true);
    table.boolean('push_quote_declined').defaultTo(true);
    table.boolean('push_equipment_conflict').defaultTo(true);
    table.boolean('push_mention').defaultTo(true);
    table.boolean('push_system_alert').defaultTo(true);
    
    // Digest settings
    table.boolean('digest_daily_enabled').defaultTo(true);
    table.string('digest_daily_time').defaultTo('09:00');
    table.boolean('digest_weekly_enabled').defaultTo(true);
    table.enum('digest_weekly_day', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).defaultTo('monday');
    table.string('digest_weekly_time').defaultTo('09:00');
    
    // Quiet hours
    table.boolean('quiet_hours_enabled').defaultTo(false);
    table.string('quiet_hours_start').defaultTo('22:00');
    table.string('quiet_hours_end').defaultTo('08:00');
    table.enum('quiet_hours_timezone', ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC']).defaultTo('America/New_York');
    
    table.timestamps(true, true);
  });

  // Push notification subscriptions (for PWA)
  await knex.schema.createTable('push_subscriptions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('endpoint').notNullable();
    table.jsonb('keys').notNullable();
    table.string('user_agent');
    table.timestamp('last_used');
    table.timestamps(true, true);
    
    table.unique(['user_id', 'endpoint']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('push_subscriptions');
  await knex.schema.dropTableIfExists('notification_preferences');
};
