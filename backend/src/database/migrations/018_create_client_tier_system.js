exports.up = async function(knex) {
  // Client Tier Benefits Configuration
  await knex.schema.createTable('client_tier_benefits', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.enum('tier', ['bronze', 'silver', 'gold', 'platinum']).notNullable().unique();
    table.string('name').notNullable();
    table.text('description');
    table.integer('booking_discount_percent').defaultTo(0);
    table.integer('priority_support_level').defaultTo(0); // 0=normal, 1=priority, 2=vip
    table.boolean('dedicated_account_manager').defaultTo(false);
    table.integer('advance_booking_days').defaultTo(30); // How many days in advance can they book
    table.integer('free_delivery_threshold').defaultTo(0); // Order value for free delivery
    table.integer('late_payment_grace_days').defaultTo(0);
    table.integer('custom_package_discount').defaultTo(0);
    table.boolean('exclusive_equipment_access').defaultTo(false);
    table.boolean('beta_features_access').defaultTo(false);
    table.jsonb('perks').defaultTo('[]'); // Additional perks as array
    table.decimal('annual_spend_threshold', 12, 2); // Minimum to maintain tier
    table.decimal('annual_spend_maximum', 12, 2); // Max for tier (null for platinum)
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Client Tier History
  await knex.schema.createTable('client_tier_history', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE').notNullable();
    table.enum('from_tier', ['bronze', 'silver', 'gold', 'platinum']);
    table.enum('to_tier', ['bronze', 'silver', 'gold', 'platinum']).notNullable();
    table.enum('change_reason', ['auto_upgrade', 'manual_upgrade', 'auto_downgrade', 'manual_downgrade', 'spending_threshold', 'promotion']);
    table.decimal('spending_at_change', 12, 2).defaultTo(0);
    table.uuid('changed_by').references('id').inTable('users');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['client_id', 'created_at']);
  });

  // Client Spending Summary (cached for performance)
  await knex.schema.createTable('client_spending_summary', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE').notNullable().unique();
    table.decimal('total_lifetime_spend', 12, 2).defaultTo(0);
    table.decimal('current_year_spend', 12, 2).defaultTo(0);
    table.decimal('previous_year_spend', 12, 2).defaultTo(0);
    table.integer('total_bookings').defaultTo(0);
    table.integer('completed_bookings').defaultTo(0);
    table.decimal('average_booking_value', 12, 2).defaultTo(0);
    table.date('last_booking_date');
    table.timestamp('calculated_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.index(['current_year_spend']);
  });

  // Insert default tier benefits
  await knex('client_tier_benefits').insert([
    {
      tier: 'bronze',
      name: 'Bronze Member',
      description: 'Entry-level tier with standard benefits',
      booking_discount_percent: 0,
      priority_support_level: 0,
      dedicated_account_manager: false,
      advance_booking_days: 30,
      free_delivery_threshold: 500,
      late_payment_grace_days: 0,
      custom_package_discount: 0,
      exclusive_equipment_access: false,
      beta_features_access: false,
      perks: JSON.stringify(['Standard Support', 'Online Booking']),
      annual_spend_threshold: 0,
      annual_spend_maximum: 9999
    },
    {
      tier: 'silver',
      name: 'Silver Member',
      description: 'Enhanced benefits for regular customers',
      booking_discount_percent: 5,
      priority_support_level: 1,
      dedicated_account_manager: false,
      advance_booking_days: 45,
      free_delivery_threshold: 300,
      late_payment_grace_days: 3,
      custom_package_discount: 5,
      exclusive_equipment_access: false,
      beta_features_access: false,
      perks: JSON.stringify(['Priority Support', '5% Discount', 'Extended Booking Window']),
      annual_spend_threshold: 10000,
      annual_spend_maximum: 49999
    },
    {
      tier: 'gold',
      name: 'Gold Member',
      description: 'Premium benefits for valued customers',
      booking_discount_percent: 10,
      priority_support_level: 2,
      dedicated_account_manager: true,
      advance_booking_days: 60,
      free_delivery_threshold: 150,
      late_payment_grace_days: 7,
      custom_package_discount: 10,
      exclusive_equipment_access: true,
      beta_features_access: true,
      perks: JSON.stringify(['VIP Support', '10% Discount', 'Account Manager', 'Early Equipment Access', 'Free Delivery Over $150']),
      annual_spend_threshold: 50000,
      annual_spend_maximum: 149999
    },
    {
      tier: 'platinum',
      name: 'Platinum Member',
      description: 'Ultimate benefits for top-tier customers',
      booking_discount_percent: 15,
      priority_support_level: 2,
      dedicated_account_manager: true,
      advance_booking_days: 90,
      free_delivery_threshold: 0,
      late_payment_grace_days: 14,
      custom_package_discount: 15,
      exclusive_equipment_access: true,
      beta_features_access: true,
      perks: JSON.stringify(['White Glove Support', '15% Discount', 'Dedicated Account Manager', 'Unlimited Free Delivery', 'Custom Equipment Access', 'Flexible Payment Terms']),
      annual_spend_threshold: 150000,
      annual_spend_maximum: null
    }
  ]);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('client_spending_summary');
  await knex.schema.dropTableIfExists('client_tier_history');
  await knex.schema.dropTableIfExists('client_tier_benefits');
};
