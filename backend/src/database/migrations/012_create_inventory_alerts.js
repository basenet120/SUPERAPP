exports.up = async function(knex) {
  // Inventory Alert Rules
  await knex.schema.createTable('inventory_alert_rules', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.enum('type', [
      'low_stock',
      'maintenance_due',
      'overdue_return',
      'condition_change',
      'high_demand',
      'equipment_inactive'
    ]).notNullable();
    
    // Conditions
    table.jsonb('conditions').defaultTo('{}'); // { threshold, operator, value }
    
    // Scope
    table.enum('scope', ['all', 'category', 'equipment', 'vendor']).defaultTo('all');
    table.uuid('scope_id'); // category_id, equipment_id, or vendor_id
    
    // Notification settings
    table.enum('severity', ['info', 'warning', 'critical']).defaultTo('warning');
    table.boolean('email_notification').defaultTo(true);
    table.boolean('push_notification').defaultTo(true);
    table.boolean('dashboard_notification').defaultTo(true);
    table.jsonb('notify_users').defaultTo('[]'); // Array of user IDs
    table.jsonb('notify_roles').defaultTo('[]'); // Array of role IDs
    
    // Schedule
    table.enum('frequency', ['immediate', 'hourly', 'daily', 'weekly']).defaultTo('immediate');
    table.time('schedule_time'); // For daily/weekly
    
    table.boolean('is_active').defaultTo(true);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    table.index(['type', 'is_active']);
    table.index(['scope', 'scope_id']);
  });

  // Inventory Alerts (generated instances)
  await knex.schema.createTable('inventory_alerts', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('rule_id').references('id').inTable('inventory_alert_rules').onDelete('SET NULL');
    table.enum('type', [
      'low_stock',
      'maintenance_due',
      'overdue_return',
      'condition_change',
      'high_demand',
      'equipment_inactive'
    ]).notNullable();
    
    // Related entities
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.uuid('maintenance_id').references('id').inTable('equipment_maintenance').onDelete('CASCADE');
    
    // Alert details
    table.string('title').notNullable();
    table.text('description');
    table.jsonb('data').defaultTo('{}'); // Context-specific data
    table.enum('severity', ['info', 'warning', 'critical']).notNullable();
    
    // Status
    table.enum('status', ['active', 'acknowledged', 'resolved', 'ignored']).defaultTo('active');
    table.uuid('acknowledged_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('acknowledged_at');
    table.uuid('resolved_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('resolved_at');
    table.text('resolution_notes');
    
    // Notifications sent
    table.jsonb('notifications_sent').defaultTo('[]');
    table.timestamps(true, true);
    table.index(['type', 'status']);
    table.index(['equipment_id', 'status']);
    table.index(['created_at']);
  });

  // Equipment Condition History
  await knex.schema.createTable('equipment_condition_history', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE').notNullable();
    table.enum('old_condition', ['excellent', 'good', 'fair', 'poor']).notNullable();
    table.enum('new_condition', ['excellent', 'good', 'fair', 'poor']).notNullable();
    table.text('reason');
    table.text('notes');
    table.jsonb('photos').defaultTo('[]');
    table.uuid('changed_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.timestamps(true, true);
    table.index(['equipment_id', 'created_at']);
  });

  // Low Stock Tracking
  await knex.schema.createTable('equipment_stock_levels', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE').notNullable();
    table.integer('total_quantity').defaultTo(1);
    table.integer('available_quantity').defaultTo(1);
    table.integer('rented_quantity').defaultTo(0);
    table.integer('maintenance_quantity').defaultTo(0);
    table.integer('min_stock_level').defaultTo(1);
    table.integer('reorder_point').defaultTo(2);
    table.integer('reorder_quantity').defaultTo(1);
    table.boolean('auto_reorder').defaultTo(false);
    table.uuid('vendor_id').references('id').inTable('vendors').onDelete('SET NULL');
    table.timestamps(true, true);
    table.unique('equipment_id');
  });

  // Insert default alert rules
  await knex('inventory_alert_rules').insert([
    {
      name: 'Overdue Returns',
      type: 'overdue_return',
      conditions: JSON.stringify({ hours_overdue: 2 }),
      scope: 'all',
      severity: 'critical',
      frequency: 'hourly'
    },
    {
      name: 'Maintenance Due',
      type: 'maintenance_due',
      conditions: JSON.stringify({ days_before: 7 }),
      scope: 'all',
      severity: 'warning',
      frequency: 'daily'
    },
    {
      name: 'Low Stock',
      type: 'low_stock',
      conditions: JSON.stringify({ threshold: 2 }),
      scope: 'all',
      severity: 'warning',
      frequency: 'immediate'
    }
  ]);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('equipment_stock_levels');
  await knex.schema.dropTableIfExists('equipment_condition_history');
  await knex.schema.dropTableIfExists('inventory_alerts');
  await knex.schema.dropTableIfExists('inventory_alert_rules');
};
