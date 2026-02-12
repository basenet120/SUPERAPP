// Advanced Search Migration
exports.up = async function(knex) {
  // Create search configuration table
  await knex.schema.createTable('search_indexes', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('entity_type').notNullable(); // 'equipment', 'booking', 'client', 'project', etc.
    table.uuid('entity_id').notNullable();
    table.text('search_text').notNullable();
    table.tsvector('search_vector');
    table.jsonb('metadata'); // Store relevant fields for filtering
    table.timestamp('indexed_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    table.index(['entity_type', 'entity_id']);
    table.index('search_vector');
  });

  // Saved searches for users
  await knex.schema.createTable('saved_searches', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.jsonb('filters').notNullable(); // Store filter configuration
    table.string('entity_type'); // Type of entity searched
    table.enum('notify_frequency', ['never', 'daily', 'weekly']).defaultTo('never');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.index(['user_id', 'entity_type']);
  });

  // Search suggestions/cache
  await knex.schema.createTable('search_suggestions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('query').notNullable();
    table.string('entity_type');
    table.integer('frequency').defaultTo(1);
    table.timestamp('last_used').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.index(['query', 'entity_type']);
  });

  // Create indexes for full-text search on existing tables
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_equipment_search 
    ON equipment USING gin(
      setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(brand, '')), 'C') ||
      setweight(to_tsvector('english', COALESCE(model, '')), 'C')
    )
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_clients_search 
    ON clients USING gin(
      setweight(to_tsvector('english', COALESCE(company_name, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(contact_name, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(email, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(phone, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(notes, '')), 'C')
    )
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_projects_search 
    ON projects USING gin(
      setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(notes, '')), 'C')
    )
  `);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('search_suggestions');
  await knex.schema.dropTableIfExists('saved_searches');
  await knex.schema.dropTableIfExists('search_indexes');
  
  await knex.raw('DROP INDEX IF EXISTS idx_equipment_search');
  await knex.raw('DROP INDEX IF EXISTS idx_clients_search');
  await knex.raw('DROP INDEX IF EXISTS idx_projects_search');
};