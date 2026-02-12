// Document Management Migration
exports.up = async function(knex) {
  // Documents table
  await knex.schema.createTable('documents', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('original_name').notNullable();
    table.text('description');
    
    // File storage
    table.string('file_path').notNullable();
    table.string('file_url').notNullable();
    table.string('mime_type').notNullable();
    table.bigInteger('file_size').notNullable();
    table.string('checksum');
    
    // Document type and category
    table.enum('type', [
      'contract', 'coi', 'quote', 'invoice', 'proposal', 
      'receipt', 'permit', 'release_form', 'script', 
      'storyboard', 'call_sheet', 'other'
    ]).defaultTo('other');
    table.string('category');
    table.string('tags');
    
    // Ownership
    table.uuid('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('company_id').references('id').inTable('companies').onDelete('CASCADE');
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    
    // Status and visibility
    table.enum('status', ['active', 'archived', 'expired', 'pending_review']).defaultTo('active');
    table.enum('visibility', ['private', 'internal', 'client', 'public']).defaultTo('internal');
    
    // Version control
    table.integer('version').defaultTo(1);
    table.uuid('parent_document_id').references('id').inTable('documents').onDelete('SET NULL');
    table.boolean('is_latest_version').defaultTo(true);
    
    // Expiration (for COIs, contracts, etc.)
    table.date('effective_date');
    table.date('expiration_date');
    
    // OCR and search
    table.text('ocr_text');
    table.tsvector('search_vector');
    
    table.timestamps(true, true);
    table.index(['client_id', 'type']);
    table.index(['project_id']);
    table.index(['type', 'status']);
    table.index('search_vector');
  });

  // Document versions history
  await knex.schema.createTable('document_versions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('document_id').references('id').inTable('documents').onDelete('CASCADE').notNullable();
    table.integer('version').notNullable();
    table.string('file_path').notNullable();
    table.string('change_notes');
    table.uuid('changed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['document_id', 'version']);
  });

  // Document access log
  await knex.schema.createTable('document_access_logs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('document_id').references('id').inTable('documents').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.enum('action', ['view', 'download', 'edit', 'delete', 'share']).notNullable();
    table.string('ip_address');
    table.string('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['document_id', 'created_at']);
    table.index(['user_id']);
  });

  // Document signatures
  await knex.schema.createTable('document_signatures', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('document_id').references('id').inTable('documents').onDelete('CASCADE').notNullable();
    table.uuid('signer_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('signer_name').notNullable();
    table.string('signer_email').notNullable();
    table.string('signature_data'); // Base64 signature image
    table.timestamp('signed_at');
    table.string('ip_address');
    table.enum('status', ['pending', 'signed', 'declined', 'expired']).defaultTo('pending');
    table.integer('sign_order').defaultTo(1);
    table.timestamps(true, true);
    table.index(['document_id', 'status']);
  });

  // Create search index trigger
  await knex.raw(`
    CREATE OR REPLACE FUNCTION documents_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.ocr_text, '')), 'C');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER documents_search_vector_trigger
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION documents_search_vector_update();
  `);
};

exports.down = async function(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS documents_search_vector_trigger ON documents');
  await knex.raw('DROP FUNCTION IF EXISTS documents_search_vector_update');
  await knex.schema.dropTableIfExists('document_signatures');
  await knex.schema.dropTableIfExists('document_access_logs');
  await knex.schema.dropTableIfExists('document_versions');
  await knex.schema.dropTableIfExists('documents');
};