exports.up = async function(knex) {
  // Add tier fields to clients table
  await knex.schema.table('clients', table => {
    table.enum('tier', ['bronze', 'silver', 'gold', 'platinum']).defaultTo('bronze');
    table.decimal('lifetime_spend', 12, 2).defaultTo(0);
    table.integer('total_bookings').defaultTo(0);
    table.timestamp('tier_assigned_at');
    table.jsonb('tier_benefits').defaultTo('{}');
  });

  // Client Tags
  await knex.schema.createTable('client_tags', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('slug').unique().notNullable();
    table.string('color').defaultTo('#6B7280');
    table.text('description');
    table.enum('category', ['status', 'type', 'custom']).defaultTo('custom');
    table.timestamps(true, true);
  });

  // Client-Tag relationships
  await knex.schema.createTable('client_tag_relations', table => {
    table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('tag_id').references('id').inTable('client_tags').onDelete('CASCADE');
    table.uuid('added_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('added_at').defaultTo(knex.fn.now());
    table.primary(['client_id', 'tag_id']);
  });

  // Client Notes
  await knex.schema.createTable('client_notes', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE').notNullable();
    table.text('content').notNullable();
    table.enum('type', ['general', 'preferences', 'issues', 'vip', 'billing']).defaultTo('general');
    table.boolean('is_private').defaultTo(false);
    table.boolean('is_pinned').defaultTo(false);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    table.index(['client_id', 'type']);
    table.index(['client_id', 'is_pinned']);
  });

  // Communication History
  await knex.schema.createTable('client_communications', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE').notNullable();
    table.enum('type', ['email', 'phone', 'sms', 'meeting', 'video_call', 'note']).notNullable();
    table.enum('direction', ['inbound', 'outbound']).notNullable();
    table.text('subject');
    table.text('content');
    table.jsonb('metadata').defaultTo('{}'); // duration, recording_url, etc
    table.uuid('related_booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.uuid('related_deal_id').references('id').inTable('deals').onDelete('SET NULL');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    table.index(['client_id', 'created_at']);
    table.index(['client_id', 'type']);
    table.index(['created_at']);
  });

  // Client Tier History
  await knex.schema.createTable('client_tier_history', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE').notNullable();
    table.enum('from_tier', ['bronze', 'silver', 'gold', 'platinum']);
    table.enum('to_tier', ['bronze', 'silver', 'gold', 'platinum']).notNullable();
    table.decimal('spend_at_change', 12, 2);
    table.text('reason');
    table.uuid('changed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    table.index(['client_id', 'created_at']);
  });

  // Insert default tier benefits
  const defaultTiers = [
    {
      name: 'bronze',
      benefits: JSON.stringify({
        discount_percent: 0,
        priority_booking: false,
        free_delivery_threshold: 500,
        support_response_hours: 48,
        late_fee_waiver: false,
        exclusive_events: false
      })
    },
    {
      name: 'silver',
      benefits: JSON.stringify({
        discount_percent: 5,
        priority_booking: false,
        free_delivery_threshold: 300,
        support_response_hours: 24,
        late_fee_waiver: false,
        exclusive_events: false
      })
    },
    {
      name: 'gold',
      benefits: JSON.stringify({
        discount_percent: 10,
        priority_booking: true,
        free_delivery_threshold: 0,
        support_response_hours: 12,
        late_fee_waiver: true,
        exclusive_events: true
      })
    },
    {
      name: 'platinum',
      benefits: JSON.stringify({
        discount_percent: 15,
        priority_booking: true,
        free_delivery_threshold: 0,
        support_response_hours: 4,
        late_fee_waiver: true,
        exclusive_events: true,
        dedicated_account_manager: true,
        custom_equipment_requests: true
      })
    }
  ];

  // Create tier_config table
  await knex.schema.createTable('tier_config', table => {
    table.enum('tier', ['bronze', 'silver', 'gold', 'platinum']).primary();
    table.string('display_name').notNullable();
    table.text('description');
    table.decimal('min_spend', 12, 2).defaultTo(0);
    table.integer('min_bookings').defaultTo(0);
    table.jsonb('benefits').defaultTo('{}');
    table.string('color').defaultTo('#6B7280');
    table.string('icon');
    table.timestamps(true, true);
  });

  // Insert default tier configs
  await knex('tier_config').insert([
    { tier: 'bronze', display_name: 'Bronze', description: 'New clients', min_spend: 0, min_bookings: 0, color: '#CD7F32', benefits: defaultTiers[0].benefits },
    { tier: 'silver', display_name: 'Silver', description: 'Regular clients', min_spend: 5000, min_bookings: 3, color: '#C0C0C0', benefits: defaultTiers[1].benefits },
    { tier: 'gold', display_name: 'Gold', description: 'Valued clients', min_spend: 20000, min_bookings: 10, color: '#FFD700', benefits: defaultTiers[2].benefits },
    { tier: 'platinum', display_name: 'Platinum', description: 'VIP clients', min_spend: 100000, min_bookings: 25, color: '#E5E4E2', benefits: defaultTiers[3].benefits }
  ]);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('tier_config');
  await knex.schema.dropTableIfExists('client_tier_history');
  await knex.schema.dropTableIfExists('client_communications');
  await knex.schema.dropTableIfExists('client_notes');
  await knex.schema.dropTableIfExists('client_tag_relations');
  await knex.schema.dropTableIfExists('client_tags');
  
  await knex.schema.table('clients', table => {
    table.dropColumn('tier');
    table.dropColumn('lifetime_spend');
    table.dropColumn('total_bookings');
    table.dropColumn('tier_assigned_at');
    table.dropColumn('tier_benefits');
  });
};
