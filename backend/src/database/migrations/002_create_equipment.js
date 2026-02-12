exports.up = async function(knex) {
  // Equipment Categories
  await knex.schema.createTable('equipment_categories', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('slug').unique().notNullable();
    table.text('description');
    table.uuid('parent_id').references('id').inTable('equipment_categories').onDelete('SET NULL');
    table.integer('sort_order').defaultTo(0);
    table.text('image_url');
    table.timestamps(true, true);
  });

  // Vendors/Partners
  await knex.schema.createTable('vendors', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('slug').unique().notNullable();
    table.enum('type', ['in_house', 'partner', 'hybrid']).defaultTo('in_house');
    table.text('description');
    table.string('contact_name');
    table.string('contact_email');
    table.string('contact_phone');
    table.text('address');
    table.string('website');
    table.decimal('markup_percentage', 5, 2).defaultTo(0);
    table.decimal('default_discount', 5, 2).defaultTo(0);
    table.jsonb('rate_cards').defaultTo('{}');
    table.enum('status', ['active', 'inactive', 'pending']).defaultTo('active');
    table.text('notes');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
  });

  // Equipment Items
  await knex.schema.createTable('equipment', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('sku').unique();
    table.text('description');
    table.uuid('category_id').references('id').inTable('equipment_categories').onDelete('SET NULL');
    table.uuid('vendor_id').references('id').inTable('vendors').onDelete('SET NULL');
    table.enum('ownership_type', ['owned', 'rented', 'partner']).defaultTo('owned');
    table.enum('status', ['available', 'rented', 'maintenance', 'retired', 'lost']).defaultTo('available');
    table.enum('condition', ['excellent', 'good', 'fair', 'poor']).defaultTo('good');
    table.decimal('daily_rate', 10, 2).notNullable();
    table.decimal('weekly_rate', 10, 2);
    table.decimal('monthly_rate', 10, 2);
    table.decimal('purchase_price', 10, 2);
    table.date('purchase_date');
    table.string('serial_number');
    table.text('barcode');
    table.text('qr_code');
    table.jsonb('specifications').defaultTo('{}');
    table.jsonb('images').defaultTo('[]');
    table.text('location');
    table.text('notes');
    table.date('last_maintenance_date');
    table.date('next_maintenance_date');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    table.index(['category_id', 'status']);
    table.index(['vendor_id']);
    table.index(['sku']);
  });

  // Equipment Tags
  await knex.schema.createTable('equipment_tags', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').unique().notNullable();
    table.string('slug').unique().notNullable();
    table.text('description');
    table.timestamps(true, true);
  });

  // Equipment-Tag relationship
  await knex.schema.createTable('equipment_tag_relations', table => {
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE');
    table.uuid('tag_id').references('id').inTable('equipment_tags').onDelete('CASCADE');
    table.primary(['equipment_id', 'tag_id']);
  });

  // Equipment Kits/Bundles
  await knex.schema.createTable('equipment_kits', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.text('description');
    table.decimal('discount_percentage', 5, 2).defaultTo(0);
    table.enum('status', ['active', 'inactive']).defaultTo('active');
    table.timestamps(true, true);
  });

  // Kit Items
  await knex.schema.createTable('kit_items', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('kit_id').references('id').inTable('equipment_kits').onDelete('CASCADE');
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE');
    table.integer('quantity').defaultTo(1);
    table.decimal('override_price', 10, 2);
    table.timestamps(true, true);
  });

  // Equipment Maintenance Log
  await knex.schema.createTable('equipment_maintenance', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE');
    table.enum('type', ['routine', 'repair', 'inspection', 'cleaning']).notNullable();
    table.text('description').notNullable();
    table.date('scheduled_date');
    table.date('completed_date');
    table.uuid('performed_by').references('id').inTable('users');
    table.decimal('cost', 10, 2);
    table.text('notes');
    table.enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled']).defaultTo('scheduled');
    table.timestamps(true, true);
  });

  // Create search index
  await knex.raw(`
    CREATE INDEX idx_equipment_search ON equipment 
    USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')))
  `);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('equipment_maintenance');
  await knex.schema.dropTableIfExists('kit_items');
  await knex.schema.dropTableIfExists('equipment_kits');
  await knex.schema.dropTableIfExists('equipment_tag_relations');
  await knex.schema.dropTableIfExists('equipment_tags');
  await knex.schema.dropTableIfExists('equipment');
  await knex.schema.dropTableIfExists('vendors');
  await knex.schema.dropTableIfExists('equipment_categories');
};
