exports.up = async function(knex) {
  // QuickBooks Connection
  await knex.schema.createTable('quickbooks_connections', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('realm_id').notNullable();
    table.string('access_token').notNullable();
    table.string('refresh_token').notNullable();
    table.timestamp('token_expires_at').notNullable();
    table.string('company_name');
    table.string('company_email');
    table.enum('environment', ['sandbox', 'production']).defaultTo('sandbox');
    table.boolean('active').defaultTo(true);
    table.timestamp('connected_at').defaultTo(knex.fn.now());
    table.timestamp('last_sync_at');
    table.timestamps(true, true);
  });

  // QuickBooks Sync Log
  await knex.schema.createTable('quickbooks_sync_logs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('connection_id').references('id').inTable('quickbooks_connections');
    table.enum('entity_type', ['customer', 'invoice', 'payment', 'item', 'account', 'estimate'])
      .notNullable();
    table.enum('sync_type', ['push', 'pull', 'bidirectional']).notNullable();
    table.enum('status', ['pending', 'in_progress', 'completed', 'failed', 'partial'])
      .defaultTo('pending');
    table.integer('records_processed').defaultTo(0);
    table.integer('records_created').defaultTo(0);
    table.integer('records_updated').defaultTo(0);
    table.integer('records_failed').defaultTo(0);
    table.jsonb('errors').defaultTo('[]');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.text('notes');
    table.timestamps(true, true);
  });

  // Documents
  await knex.schema.createTable('documents', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.text('description');
    table.enum('type', [
      'contract', 'coi', 'permit', 'invoice', 'receipt',
      'quote', 'proposal', 'image', 'video', 'other'
    ]).defaultTo('other');
    table.string('file_url').notNullable();
    table.string('file_name').notNullable();
    table.string('file_type');
    table.bigInteger('file_size');
    table.uuid('uploaded_by').references('id').inTable('users');
    table.uuid('project_id').references('id').inTable('projects').onDelete('SET NULL');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.uuid('client_id').references('id').inTable('clients').onDelete('SET NULL');
    table.uuid('parent_id').references('id').inTable('documents');
    table.integer('version').defaultTo(1);
    table.boolean('is_latest').defaultTo(true);
    table.enum('visibility', ['private', 'internal', 'client', 'public']).defaultTo('internal');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    table.index(['type', 'project_id']);
    table.index(['booking_id']);
  });

  // Time Tracking
  await knex.schema.createTable('time_entries', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('project_id').references('id').inTable('projects').onDelete('SET NULL');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.string('task_description').notNullable();
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time');
    table.decimal('duration_hours', 8, 2);
    table.boolean('billable').defaultTo(true);
    table.decimal('hourly_rate', 10, 2);
    table.enum('status', ['running', 'paused', 'completed', 'invoiced']).defaultTo('running');
    table.text('notes');
    table.timestamps(true, true);
    table.index(['user_id', 'start_time']);
    table.index(['project_id']);
  });

  // Expenses
  await knex.schema.createTable('expenses', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('project_id').references('id').inTable('projects').onDelete('SET NULL');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.enum('category', [
      'equipment_rental', 'travel', 'meals', 'supplies', 'shipping',
      'contractor', 'software', 'marketing', 'office', 'other'
    ]).notNullable();
    table.string('vendor_name');
    table.text('description').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.date('expense_date').notNullable();
    table.text('receipt_url');
    table.enum('status', ['pending', 'approved', 'rejected', 'reimbursed', 'billed'])
      .defaultTo('pending');
    table.uuid('approved_by').references('id').inTable('users');
    table.timestamp('approved_at');
    table.text('notes');
    table.string('quickbooks_expense_id');
    table.timestamps(true, true);
  });

  // Tasks/Project Management
  await knex.schema.createTable('tasks', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title').notNullable();
    table.text('description');
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('assigned_to').references('id').inTable('users');
    table.enum('status', ['backlog', 'todo', 'in_progress', 'review', 'completed', 'cancelled'])
      .defaultTo('backlog');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.date('due_date');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.decimal('estimated_hours', 6, 2);
    table.decimal('actual_hours', 6, 2);
    table.uuid('parent_id').references('id').inTable('tasks');
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);
  });

  // Calendar Events
  await knex.schema.createTable('calendar_events', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title').notNullable();
    table.text('description');
    table.enum('type', ['booking', 'meeting', 'shoot', 'delivery', 'maintenance', 'personal', 'other'])
      .defaultTo('other');
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time').notNullable();
    table.string('location');
    table.boolean('all_day').defaultTo(false);
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('project_id').references('id').inTable('projects').onDelete('SET NULL');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.jsonb('attendees').defaultTo('[]');
    table.text('google_event_id');
    table.text('outlook_event_id');
    table.enum('visibility', ['private', 'internal', 'client']).defaultTo('internal');
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('calendar_events');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('expenses');
  await knex.schema.dropTableIfExists('time_entries');
  await knex.schema.dropTableIfExists('documents');
  await knex.schema.dropTableIfExists('quickbooks_sync_logs');
  await knex.schema.dropTableIfExists('quickbooks_connections');
};
