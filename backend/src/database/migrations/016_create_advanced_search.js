exports.up = async function(knex) {
  // Search index table for efficient full-text search
  await knex.schema.createTable('search_index', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Entity reference
    table.enum('entity_type', [
      'contact',
      'company',
      'booking',
      'equipment',
      'project',
      'task',
      'document',
      'employee',
      'deal',
      'note',
      'activity'
    ]).notNullable();
    table.uuid('entity_id').notNullable();
    
    // Organization
    table.uuid('organization_id'); // For multi-tenant support
    
    // Searchable content
    table.text('title').notNullable();
    table.text('content');
    table.text('content_vector'); // For vector search (future)
    
    // Searchable metadata (JSON for flexibility)
    table.jsonb('metadata').defaultTo('{}');
    
    // Facets for filtering
    table.string('status');
    table.string('category');
    table.date('entity_date');
    table.uuid('assigned_to');
    table.uuid('created_by');
    
    // Relevance scoring
    table.float('relevance_score').defaultTo(1.0);
    
    // Timestamps
    table.timestamp('entity_created_at');
    table.timestamp('entity_updated_at');
    table.timestamp('indexed_at').defaultTo(knex.fn.now());
    
    // Soft delete tracking
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at');
    
    // Indexes
    table.unique(['entity_type', 'entity_id']);
    table.index(['entity_type']);
    table.index(['status']);
    table.index(['category']);
    table.index(['entity_date']);
    table.index(['assigned_to']);
    table.index(['created_by']);
    table.index(['is_deleted']);
    
    // Composite index for common queries
    table.index(['entity_type', 'status', 'entity_date']);
  });

  // Search queries log (for analytics and suggestions)
  await knex.schema.createTable('search_queries', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    
    table.text('query').notNullable();
    table.jsonb('filters');
    table.integer('results_count');
    table.boolean('has_results').defaultTo(false);
    
    // Performance tracking
    table.integer('execution_time_ms');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['user_id', 'created_at']);
    table.index(['query']);
  });

  // Saved searches
  await knex.schema.createTable('saved_searches', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    
    table.string('name').notNullable();
    table.text('description');
    table.text('query');
    table.jsonb('filters');
    table.jsonb('sort_config');
    
    table.enum('scope', ['personal', 'shared', 'global']).defaultTo('personal');
    table.boolean('notify_on_new_results').defaultTo(false);
    
    table.timestamps(true, true);
    table.index(['user_id']);
  });

  // Recent items (for quick access)
  await knex.schema.createTable('recent_items', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    
    table.enum('entity_type', [
      'contact',
      'company',
      'booking',
      'equipment',
      'project',
      'task',
      'document',
      'employee'
    ]).notNullable();
    table.uuid('entity_id').notNullable();
    
    table.enum('action', ['viewed', 'edited', 'created']).defaultTo('viewed');
    table.timestamp('accessed_at').defaultTo(knex.fn.now());
    
    table.unique(['user_id', 'entity_type', 'entity_id']);
    table.index(['user_id', 'accessed_at']);
  });

  // Create GIN indexes for JSONB columns (for faster JSON queries)
  await knex.raw('CREATE INDEX idx_search_index_metadata ON search_index USING GIN (metadata)');
  await knex.raw('CREATE INDEX idx_search_queries_filters ON search_queries USING GIN (filters)');
  
  // Create full-text search indexes using PostgreSQL tsvector
  // Note: These will be created via triggers, this is just preparation
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('recent_items');
  await knex.schema.dropTableIfExists('saved_searches');
  await knex.schema.dropTableIfExists('search_queries');
  await knex.schema.dropTableIfExists('search_index');
};
