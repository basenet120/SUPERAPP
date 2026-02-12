exports.up = async function(knex) {
  // Clients/Customers
  await knex.schema.createTable('clients', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('company_name');
    table.string('contact_name').notNullable();
    table.string('email').notNullable();
    table.string('phone');
    table.text('address');
    table.string('city');
    table.string('state');
    table.string('zip');
    table.string('country');
    table.enum('type', ['individual', 'company', 'studio', 'agency']).defaultTo('individual');
    table.enum('status', ['active', 'inactive', 'blacklisted']).defaultTo('active');
    table.enum('tier', ['bronze', 'silver', 'gold', 'platinum']).defaultTo('bronze');
    table.decimal('credit_limit', 10, 2).defaultTo(0);
    table.decimal('outstanding_balance', 10, 2).defaultTo(0);
    table.string('tax_id');
    table.text('notes');
    table.text('internal_notes');
    table.string('quickbooks_id');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    table.index(['email']);
    table.index(['quickbooks_id']);
  });

  // Projects
  await knex.schema.createTable('projects', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.text('description');
    table.uuid('client_id').references('id').inTable('clients').onDelete('SET NULL');
    table.uuid('project_manager_id').references('id').inTable('users');
    table.date('start_date');
    table.date('end_date');
    table.enum('status', ['planning', 'active', 'on_hold', 'completed', 'cancelled']).defaultTo('planning');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.decimal('budget', 12, 2);
    table.decimal('actual_cost', 12, 2).defaultTo(0);
    table.text('location');
    table.text('notes');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
  });

  // Bookings/Quotes
  await knex.schema.createTable('bookings', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('booking_number').unique().notNullable();
    table.uuid('client_id').references('id').inTable('clients').onDelete('SET NULL');
    table.uuid('project_id').references('id').inTable('projects').onDelete('SET NULL');
    table.uuid('created_by').references('id').inTable('users');
    table.enum('status', [
      'draft', 'quote_sent', 'quote_accepted', 'quote_rejected',
      'contract_sent', 'contract_signed', 'deposit_pending',
      'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'
    ]).defaultTo('draft');
    table.enum('type', ['rental', 'purchase', 'service', 'hybrid']).defaultTo('rental');
    table.timestamp('pickup_datetime');
    table.timestamp('return_datetime');
    table.text('pickup_location');
    table.text('return_location');
    table.text('shoot_location');
    table.text('description');
    table.decimal('subtotal', 12, 2).defaultTo(0);
    table.decimal('tax_amount', 12, 2).defaultTo(0);
    table.decimal('discount_amount', 12, 2).defaultTo(0);
    table.decimal('total_amount', 12, 2).defaultTo(0);
    table.decimal('deposit_amount', 12, 2).defaultTo(0);
    table.decimal('paid_amount', 12, 2).defaultTo(0);
    table.decimal('balance_due', 12, 2).defaultTo(0);
    table.timestamp('payment_due_date');
    table.boolean('coi_received').defaultTo(false);
    table.text('coi_url');
    table.date('coi_expiry_date');
    table.boolean('contract_signed').defaultTo(false);
    table.timestamp('contract_signed_at');
    table.text('contract_url');
    table.boolean('deposit_paid').defaultTo(false);
    table.timestamp('deposit_paid_at');
    table.text('special_requests');
    table.text('internal_notes');
    table.string('quickbooks_invoice_id');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    table.index(['client_id', 'status']);
    table.index(['booking_number']);
    table.index(['pickup_datetime', 'return_datetime']);
  });

  // Booking Items
  await knex.schema.createTable('booking_items', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.uuid('equipment_id').references('id').inTable('equipment');
    table.uuid('kit_id').references('id').inTable('equipment_kits');
    table.integer('quantity').defaultTo(1);
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('total_price', 10, 2).notNullable();
    table.integer('rental_days').defaultTo(1);
    table.enum('status', ['pending', 'reserved', 'picked_up', 'returned', 'damaged', 'lost'])
      .defaultTo('pending');
    table.timestamp('picked_up_at');
    table.timestamp('returned_at');
    table.text('condition_notes');
    table.text('notes');
    table.timestamps(true, true);
  });

  // Booking Status History
  await knex.schema.createTable('booking_status_history', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.string('from_status');
    table.string('to_status').notNullable();
    table.uuid('changed_by').references('id').inTable('users');
    table.text('reason');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Payments
  await knex.schema.createTable('payments', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.uuid('client_id').references('id').inTable('clients');
    table.enum('type', ['deposit', 'partial', 'final', 'refund', 'adjustment']).notNullable();
    table.enum('method', ['credit_card', 'bank_transfer', 'check', 'cash', 'other']).notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.enum('status', ['pending', 'completed', 'failed', 'refunded', 'cancelled']).defaultTo('pending');
    table.string('transaction_id');
    table.string('payment_processor');
    table.text('processor_response');
    table.text('notes');
    table.uuid('processed_by').references('id').inTable('users');
    table.timestamp('processed_at');
    table.string('quickbooks_payment_id');
    table.timestamps(true, true);
  });

  // COI (Certificate of Insurance)
  await knex.schema.createTable('certificates_of_insurance', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.string('provider_name').notNullable();
    table.string('policy_number').notNullable();
    table.decimal('coverage_amount', 12, 2).notNullable();
    table.date('effective_date').notNullable();
    table.date('expiry_date').notNullable();
    table.text('file_url');
    table.enum('status', ['active', 'expired', 'pending_review', 'rejected']).defaultTo('pending_review');
    table.text('notes');
    table.uuid('verified_by').references('id').inTable('users');
    table.timestamp('verified_at');
    table.timestamps(true, true);
  });

  // Booking Reminders/Emails
  await knex.schema.createTable('booking_reminders', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.enum('type', [
      'coi_reminder', 'payment_reminder', 'confirmation',
      'pre_shoot', 'post_shoot', 'pickup_reminder', 'return_reminder'
    ]).notNullable();
    table.timestamp('scheduled_at').notNullable();
    table.timestamp('sent_at');
    table.enum('status', ['pending', 'sent', 'failed', 'cancelled']).defaultTo('pending');
    table.text('error_message');
    table.integer('retry_count').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('booking_reminders');
  await knex.schema.dropTableIfExists('certificates_of_insurance');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('booking_status_history');
  await knex.schema.dropTableIfExists('booking_items');
  await knex.schema.dropTableIfExists('bookings');
  await knex.schema.dropTableIfExists('projects');
  await knex.schema.dropTableIfExists('clients');
};
