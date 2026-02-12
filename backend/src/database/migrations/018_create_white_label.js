// White-label Customization Migration
exports.up = async function(knex) {
  // Branding settings table
  await knex.schema.createTable('branding_settings', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Entity this branding applies to (null = global default)
    table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('location_id').references('id').inTable('locations').onDelete('CASCADE');
    
    // Company info
    table.string('company_name');
    table.text('tagline');
    table.string('website');
    table.string('support_email');
    table.string('support_phone');
    
    // Logo and assets
    table.string('logo_url');
    table.string('logo_dark_url'); // For dark mode
    table.string('favicon_url');
    table.string('email_header_image_url');
    
    // Colors
    table.string('primary_color').defaultTo('#3B82F6'); // Blue-500
    table.string('secondary_color').defaultTo('#1E40AF'); // Blue-800
    table.string('accent_color').defaultTo('#10B981'); // Emerald-500
    table.string('text_color').defaultTo('#1F2937'); // Gray-800
    table.string('background_color').defaultTo('#FFFFFF');
    table.string('sidebar_color').defaultTo('#111827'); // Gray-900
    
    // Typography
    table.string('heading_font').defaultTo('Inter');
    table.string('body_font').defaultTo('Inter');
    
    // Email templates
    table.string('email_sender_name');
    table.string('email_sender_address');
    table.text('email_footer_html');
    table.text('email_signature');
    
    // Portal customization
    table.string('portal_title');
    table.text('portal_welcome_message');
    table.string('portal_primary_button_text');
    table.boolean('show_powered_by').defaultTo(true);
    table.boolean('allow_client_registration').defaultTo(true);
    
    // Custom CSS/JS
    table.text('custom_css');
    table.text('custom_header_js');
    table.text('custom_footer_js');
    
    // Feature toggles
    table.boolean('enable_chat').defaultTo(true);
    table.boolean('enable_project_portal').defaultTo(true);
    table.boolean('enable_document_download').defaultTo(true);
    table.boolean('enable_equipment_browsing').defaultTo(true);
    
    // Domain settings
    table.string('custom_domain');
    table.boolean('ssl_enabled').defaultTo(true);
    
    // Status
    table.enum('status', ['active', 'inactive', 'pending']).defaultTo('active');
    table.boolean('is_default').defaultTo(false);
    
    table.timestamps(true, true);
    table.index(['client_id']);
    table.index(['location_id']);
    table.index(['custom_domain']);
  });

  // Email template overrides
  await knex.schema.createTable('email_templates', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('branding_id').references('id').inTable('branding_settings').onDelete('CASCADE').notNullable();
    
    table.string('template_key').notNullable(); // 'booking_confirmation', 'quote_sent', etc.
    table.string('subject').notNullable();
    table.text('body_html').notNullable();
    table.text('body_text');
    table.boolean('is_active').defaultTo(true);
    
    table.timestamps(true, true);
    table.unique(['branding_id', 'template_key']);
  });

  // Client portal pages
  await knex.schema.createTable('portal_pages', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('branding_id').references('id').inTable('branding_settings').onDelete('CASCADE').notNullable();
    
    table.string('slug').notNullable(); // 'terms', 'privacy', 'faq', etc.
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.enum('status', ['draft', 'published', 'archived']).defaultTo('draft');
    table.integer('sort_order').defaultTo(0);
    table.boolean('show_in_footer').defaultTo(true);
    table.boolean('show_in_nav').defaultTo(false);
    
    table.timestamps(true, true);
    table.unique(['branding_id', 'slug']);
  });

  // Add branding preference to user sessions
  await knex.schema.alterTable('user_sessions', table => {
    table.uuid('branding_id').references('id').inTable('branding_settings').onDelete('SET NULL');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('user_sessions', table => {
    table.dropColumn('branding_id');
  });
  await knex.schema.dropTableIfExists('portal_pages');
  await knex.schema.dropTableIfExists('email_templates');
  await knex.schema.dropTableIfExists('branding_settings');
};