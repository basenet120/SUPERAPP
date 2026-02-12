exports.up = async function(knex) {
  // CSV Import Jobs table
  await knex.schema.createTable('csv_import_jobs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.enum('type', ['equipment', 'clients', 'bookings', 'vendors']).notNullable().defaultTo('equipment');
    table.enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    table.integer('total_rows').defaultTo(0);
    table.integer('processed_rows').defaultTo(0);
    table.integer('success_count').defaultTo(0);
    table.integer('error_count').defaultTo(0);
    table.jsonb('results').defaultTo('{}');
    table.jsonb('error_log').defaultTo('[]');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.string('file_name');
    table.integer('file_size');
    table.jsonb('mappings').defaultTo('{}');
    table.jsonb('options').defaultTo('{}');
    table.timestamp('completed_at');
    table.timestamps(true, true);
    table.index(['status', 'created_at']);
    table.index(['type', 'status']);
  });

  // Equipment Import Templates
  await knex.schema.createTable('equipment_import_templates', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.text('description');
    table.jsonb('column_mappings').notNullable().defaultTo('{}');
    table.jsonb('default_values').defaultTo('{}');
    table.jsonb('transform_rules').defaultTo('{}');
    table.uuid('vendor_id').references('id').inTable('vendors').onDelete('SET NULL');
    table.decimal('markup_percentage', 5, 2).defaultTo(0);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.enum('status', ['active', 'inactive']).defaultTo('active');
    table.timestamps(true, true);
  });

  // Equipment Images table (for better image management)
  await knex.schema.createTable('equipment_images', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('equipment_id').references('id').inTable('equipment').onDelete('CASCADE').notNullable();
    table.string('url').notNullable();
    table.string('filename');
    table.string('mime_type');
    table.integer('file_size');
    table.boolean('is_primary').defaultTo(false);
    table.integer('sort_order').defaultTo(0);
    table.text('alt_text');
    table.enum('source', ['upload', 'url', 'import']).defaultTo('upload');
    table.timestamps(true, true);
    table.index(['equipment_id', 'sort_order']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('equipment_images');
  await knex.schema.dropTableIfExists('equipment_import_templates');
  await knex.schema.dropTableIfExists('csv_import_jobs');
};
