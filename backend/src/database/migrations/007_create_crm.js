exports.up = async function(knex) {
  // Companies table
  await knex.schema.createTable('companies', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('industry');
    table.string('size');
    table.text('address');
    table.string('website');
    table.string('phone');
    table.string('email');
    table.uuid('tenant_id').notNullable();
    table.uuid('created_by').references('id').inTable('users');
    table.timestamps(true, true);
    
    table.index('tenant_id');
    table.index('name');
  });

  // Contacts table
  await knex.schema.createTable('contacts', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('email');
    table.string('phone');
    table.uuid('company_id').references('id').inTable('companies');
    table.string('role');
    table.jsonb('tags').defaultTo('[]');
    table.enum('status', ['active', 'inactive', 'lead']).defaultTo('lead');
    table.timestamp('last_contact');
    table.uuid('tenant_id').notNullable();
    table.uuid('created_by').references('id').inTable('users');
    table.timestamps(true, true);
    
    table.index('tenant_id');
    table.index('company_id');
    table.index('email');
  });

  // Contact activities table
  await knex.schema.createTable('contact_activities', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('contact_id').notNullable().references('id').inTable('contacts').onDelete('CASCADE');
    table.enum('type', ['call', 'email', 'meeting', 'note', 'task']).notNullable();
    table.string('subject');
    table.text('description');
    table.uuid('user_id').references('id').inTable('users');
    table.timestamps(true, true);
    
    table.index('contact_id');
    table.index('user_id');
  });

  // Deals table
  await knex.schema.createTable('deals', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('contact_id').notNullable().references('id').inTable('contacts');
    table.string('title').notNullable();
    table.text('description');
    table.decimal('value', 12, 2).defaultTo(0);
    table.integer('probability').defaultTo(20);
    table.enum('stage', ['new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).defaultTo('new');
    table.string('source');
    table.date('expected_close_date');
    table.uuid('tenant_id').notNullable();
    table.uuid('created_by').references('id').inTable('users');
    table.timestamps(true, true);
    
    table.index('tenant_id');
    table.index('contact_id');
    table.index('stage');
  });

  // Deal stage history
  await knex.schema.createTable('deal_stage_history', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('deal_id').notNullable().references('id').inTable('deals').onDelete('CASCADE');
    table.string('from_stage');
    table.string('to_stage').notNullable();
    table.uuid('changed_by').references('id').inTable('users');
    table.timestamp('changed_at').defaultTo(knex.fn.now());
    
    table.index('deal_id');
  });

  // Notifications table
  await knex.schema.createTable('notifications', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('type').notNullable();
    table.string('title').notNullable();
    table.text('message');
    table.jsonb('data');
    table.boolean('read').defaultTo(false);
    table.timestamp('read_at');
    table.timestamps(true, true);
    
    table.index('user_id');
    table.index('read');
  });

  // Insert sample data for demo
  await knex('companies').insert([
    { id: knex.raw('gen_random_uuid()'), name: 'Nike', industry: 'Apparel & Sportswear', size: '10,000+', website: 'nike.com', tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: knex.raw('gen_random_uuid()'), name: 'Apple', industry: 'Technology', size: '10,000+', website: 'apple.com', tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: knex.raw('gen_random_uuid()'), name: 'Spotify', industry: 'Music Streaming', size: '5,001-10,000', website: 'spotify.com', tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: knex.raw('gen_random_uuid()'), name: 'Netflix', industry: 'Entertainment', size: '10,000+', website: 'netflix.com', tenant_id: '00000000-0000-0000-0000-000000000001' },
  ]);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('deal_stage_history');
  await knex.schema.dropTableIfExists('deals');
  await knex.schema.dropTableIfExists('contact_activities');
  await knex.schema.dropTableIfExists('contacts');
  await knex.schema.dropTableIfExists('companies');
};
