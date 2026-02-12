exports.up = async function(knex) {
  // Inventory Alerts Configuration
  await knex.schema.createTable('inventory_alert_rules', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE');
    table.uuid('category_id').references('id').inTable('equipment_categories').onDelete('CASCADE');
    // Either equipment_id or category_id must be set
    table.enum('alert_type', [
      'low_stock',
      'maintenance_due',
      'maintenance_overdue',
      'booking_overdue',
      'equipment_damaged',
      'equipment_lost',
      'high_utilization',
      'underutilized'
    ]).notNullable();
    table.enum('severity', ['info', 'warning', 'critical']).defaultTo('warning');
    table.jsonb('conditions').notNullable(); // { threshold: number, days: number, etc }
    table.text('message_template');
    table.boolean('is_active').defaultTo(true);
    table.uuid('created_by').references('id').inTable('users');
    table.timestamps(true, true);
    table.index(['equipment_id', 'alert_type']);
    table.index(['category_id', 'alert_type']);
    table.index(['is_active']);
  });

  // Inventory Alerts (generated instances)
  await knex.schema.createTable('inventory_alerts', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('rule_id').references('id').inTable('inventory_alert_rules').onDelete('SET NULL');
    table.enum('alert_type', [
      'low_stock',
      'maintenance_due',
      'maintenance_overdue',
      'booking_overdue',
      'equipment_damaged',
      'equipment_lost',
      'high_utilization',
      'underutilized'
    ]).notNullable();
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.enum('severity', ['info', 'warning', 'critical']).notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.jsonb('data').defaultTo('{}'); // Additional context
    table.enum('status', ['open', 'acknowledged', 'resolved', 'ignored']).defaultTo('open');
    table.uuid('acknowledged_by').references('id').inTable('users');
    table.timestamp('acknowledged_at');
    table.uuid('resolved_by').references('id').inTable('users');
    table.timestamp('resolved_at');
    table.text('resolution_notes');
    table.timestamp('expires_at'); // When alert auto-expires
    table.timestamps(true, true);
    table.index(['status', 'severity']);
    table.index(['equipment_id', 'status']);
    table.index(['booking_id', 'status']);
    table.index(['created_at']);
  });

  // Equipment Utilization Tracking
  await knex.schema.createTable('equipment_utilization', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE').notNullable();
    table.date('date').notNullable();
    table.enum('status', ['available', 'booked', 'maintenance', 'unavailable']).defaultTo('available');
    table.integer('booking_count').defaultTo(0);
    table.integer('rental_days').defaultTo(0);
    table.decimal('revenue', 12, 2).defaultTo(0);
    table.decimal('utilization_rate', 5, 2).defaultTo(0); // Percentage
    table.timestamps(true, true);
    table.unique(['equipment_id', 'date']);
    table.index(['date', 'utilization_rate']);
  });

  // Maintenance Schedule
  await knex.schema.createTable('maintenance_schedules', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE').notNullable();
    table.enum('type', ['routine', 'inspection', 'calibration', 'cleaning', 'repair']).notNullable();
    table.enum('frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'usage_based']).notNullable();
    table.integer('interval_value').defaultTo(1); // Every N frequency
    table.integer('usage_hours'); // For usage_based
    table.integer('usage_cycles'); // For usage_based
    table.date('last_completed_date');
    table.date('next_due_date').notNullable();
    table.integer('days_before_alert').defaultTo(7);
    table.text('checklist'); // JSON array of items
    table.text('notes');
    table.boolean('is_active').defaultTo(true);
    table.uuid('created_by').references('id').inTable('users');
    table.timestamps(true, true);
    table.index(['equipment_id', 'is_active']);
    table.index(['next_due_date']);
  });

  // Stock Levels (for tracking quantities)
  await knex.schema.createTable('equipment_stock_levels', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE').notNullable().unique();
    table.integer('total_quantity').defaultTo(1);
    table.integer('available_quantity').defaultTo(1);
    table.integer('reserved_quantity').defaultTo(0);
    table.integer('rented_quantity').defaultTo(0);
    table.integer('maintenance_quantity').defaultTo(0);
    table.integer('minimum_stock_level').defaultTo(1);
    table.integer('reorder_point').defaultTo(1);
    table.integer('reorder_quantity').defaultTo(1);
    table.uuid('preferred_vendor_id').references('id').inTable('vendors');
    table.boolean('auto_reorder').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('equipment_stock_levels');
  await knex.schema.dropTableIfExists('maintenance_schedules');
  await knex.schema.dropTableIfExists('equipment_utilization');
  await knex.schema.dropTableIfExists('inventory_alerts');
  await knex.schema.dropTableIfExists('inventory_alert_rules');
};
