// Multi-location Support Migration
exports.up = async function(knex) {
  // Locations table
  await knex.schema.createTable('locations', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('code').unique(); // Short code like "NYC", "LA", "CHI"
    table.enum('type', ['studio', 'warehouse', 'office', 'pickup_point', 'partner']).defaultTo('studio');
    
    // Address
    table.string('address_line1').notNullable();
    table.string('address_line2');
    table.string('city').notNullable();
    table.string('state').notNullable();
    table.string('postal_code').notNullable();
    table.string('country').defaultTo('USA');
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    
    // Contact
    table.string('phone');
    table.string('email');
    table.string('manager_name');
    table.uuid('manager_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Operating hours
    table.jsonb('business_hours'); // Store weekly schedule
    table.text('special_hours'); // JSON for holidays/special hours
    
    // Location settings
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_primary').defaultTo(false);
    table.boolean('allows_pickup').defaultTo(true);
    table.boolean('allows_returns').defaultTo(true);
    table.text('pickup_instructions');
    
    // Capacity and facilities
    table.integer('square_footage');
    table.integer('parking_spaces');
    table.text('facilities'); // JSON array of facilities
    table.text('access_instructions');
    
    // Branding override for white-label
    table.string('branding_logo_url');
    table.string('branding_primary_color');
    table.string('branding_secondary_color');
    
    table.timestamps(true, true);
    table.index(['city']);
    table.index(['type', 'is_active']);
    table.index(['code']);
  });

  // Equipment location assignments
  await knex.schema.createTable('equipment_locations', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE').notNullable();
    table.uuid('location_id').references('id').inTable('locations').onDelete('CASCADE').notNullable();
    
    table.integer('quantity').defaultTo(1);
    table.integer('quantity_available').defaultTo(1);
    table.string('storage_location'); // Specific spot in warehouse
    table.enum('status', ['available', 'in_use', 'maintenance', 'transit']).defaultTo('available');
    
    table.text('condition_notes');
    table.date('last_inventory_date');
    
    table.timestamps(true, true);
    table.unique(['equipment_id', 'location_id']);
    table.index(['location_id', 'status']);
  });

  // Location transfers (equipment movement between locations)
  await knex.schema.createTable('location_transfers', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE').notNullable();
    table.uuid('from_location_id').references('id').inTable('locations').onDelete('CASCADE').notNullable();
    table.uuid('to_location_id').references('id').inTable('locations').onDelete('CASCADE').notNullable();
    
    table.integer('quantity').defaultTo(1);
    table.enum('status', ['pending', 'in_transit', 'completed', 'cancelled']).defaultTo('pending');
    
    table.uuid('requested_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('requested_at').defaultTo(knex.fn.now());
    table.timestamp('approved_at');
    table.timestamp('shipped_at');
    table.timestamp('received_at');
    
    table.string('tracking_number');
    table.text('notes');
    table.text('transfer_reason');
    
    table.timestamps(true, true);
    table.index(['equipment_id', 'status']);
    table.index(['from_location_id', 'to_location_id']);
  });

  // Booking location preferences
  await knex.schema.alterTable('bookings', table => {
    table.uuid('preferred_pickup_location_id').references('id').inTable('locations').onDelete('SET NULL');
    table.uuid('actual_pickup_location_id').references('id').inTable('locations').onDelete('SET NULL');
    table.uuid('return_location_id').references('id').inTable('locations').onDelete('SET NULL');
  });

  // User location access (for multi-location staff)
  await knex.schema.createTable('user_location_access', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('location_id').references('id').inTable('locations').onDelete('CASCADE').notNullable();
    
    table.enum('access_level', ['view', 'operate', 'manage', 'admin']).defaultTo('view');
    table.boolean('is_default').defaultTo(false);
    
    table.timestamps(true, true);
    table.unique(['user_id', 'location_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('user_location_access');
  await knex.schema.dropTableIfExists('location_transfers');
  await knex.schema.dropTableIfExists('equipment_locations');
  await knex.schema.dropTableIfExists('locations');
  
  await knex.schema.alterTable('bookings', table => {
    table.dropColumn('preferred_pickup_location_id');
    table.dropColumn('actual_pickup_location_id');
    table.dropColumn('return_location_id');
  });
};