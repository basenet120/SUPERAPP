exports.up = async function(knex) {
  // Recurring Bookings
  await knex.schema.createTable('recurring_bookings', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('parent_booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.enum('frequency', ['daily', 'weekly', 'biweekly', 'monthly', 'custom']).notNullable();
    table.integer('interval').defaultTo(1); // Every N weeks/months
    table.jsonb('days_of_week').defaultTo('[]'); // [0, 1, 2, 3, 4, 5, 6] for weekly
    table.integer('day_of_month'); // For monthly
    table.date('start_date').notNullable();
    table.date('end_date'); // Null for ongoing
    table.integer('occurrences'); // Number of occurrences if end_date not set
    table.enum('status', ['active', 'paused', 'completed', 'cancelled']).defaultTo('active');
    table.timestamps(true, true);
    table.index(['parent_booking_id', 'status']);
  });

  // Booking Templates
  await knex.schema.createTable('booking_templates', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.text('description');
    table.enum('type', ['rental', 'sale', 'service', 'combo']).defaultTo('rental');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.boolean('is_public').defaultTo(false);
    table.enum('status', ['active', 'inactive']).defaultTo('active');
    
    // Template data
    table.jsonb('default_items').defaultTo('[]');
    table.jsonb('default_dates').defaultTo('{}'); // { duration_days, buffer_days }
    table.jsonb('default_locations').defaultTo('{}');
    table.jsonb('pricing_rules').defaultTo('{}');
    table.jsonb('required_documents').defaultTo('[]');
    table.jsonb('checklist').defaultTo('[]');
    
    table.timestamps(true, true);
    table.index(['created_by', 'status']);
  });

  // Equipment Waitlist
  await knex.schema.createTable('equipment_waitlist', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE').notNullable();
    table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE').notNullable();
    table.date('requested_start_date').notNullable();
    table.date('requested_end_date').notNullable();
    table.integer('quantity').defaultTo(1);
    table.enum('priority', ['low', 'normal', 'high', 'urgent']).defaultTo('normal');
    table.text('notes');
    table.enum('status', ['pending', 'notified', 'converted', 'expired', 'cancelled']).defaultTo('pending');
    table.uuid('converted_booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.timestamp('notified_at');
    table.timestamps(true, true);
    table.index(['equipment_id', 'status']);
    table.index(['client_id', 'status']);
    table.index(['requested_start_date', 'requested_end_date']);
  });

  // Booking Conflicts (for visualization)
  await knex.schema.createTable('booking_conflicts', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE').notNullable();
    table.uuid('conflicting_booking_id').references('id').inTable('bookings').onDelete('CASCADE').notNullable();
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE').notNullable();
    table.timestamp('conflict_start').notNullable();
    table.timestamp('conflict_end').notNullable();
    table.enum('severity', ['warning', 'critical']).defaultTo('warning');
    table.enum('status', ['open', 'resolved', 'ignored']).defaultTo('open');
    table.text('resolution_notes');
    table.uuid('resolved_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('resolved_at');
    table.timestamps(true, true);
    table.index(['booking_id', 'status']);
    table.index(['equipment_id', 'conflict_start']);
  });

  // Booking Availability Cache (for fast calendar views)
  await knex.schema.createTable('booking_availability_cache', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE').notNullable();
    table.date('date').notNullable();
    table.enum('status', ['available', 'limited', 'booked', 'maintenance', 'unavailable']).notNullable();
    table.integer('available_quantity').defaultTo(1);
    table.integer('booked_quantity').defaultTo(0);
    table.jsonb('booking_ids').defaultTo('[]');
    table.timestamp('calculated_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.unique(['equipment_id', 'date']);
    table.index(['date', 'status']);
  });

  // Booking Item Notes (for condition tracking per item)
  await knex.schema.createTable('booking_item_notes', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_item_id').references('id').inTable('booking_items').onDelete('CASCADE').notNullable();
    table.enum('type', ['pickup_condition', 'return_condition', 'damage', 'cleaning', 'maintenance', 'general']).notNullable();
    table.text('note').notNullable();
    table.jsonb('photos').defaultTo('[]');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    table.index(['booking_item_id', 'type']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('booking_item_notes');
  await knex.schema.dropTableIfExists('booking_availability_cache');
  await knex.schema.dropTableIfExists('booking_conflicts');
  await knex.schema.dropTableIfExists('equipment_waitlist');
  await knex.schema.dropTableIfExists('booking_templates');
  await knex.schema.dropTableIfExists('recurring_bookings');
};
