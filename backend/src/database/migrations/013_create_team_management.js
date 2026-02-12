exports.up = async function(knex) {
  // Employee Profiles (extends users)
  await knex.schema.createTable('employee_profiles', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable().unique();
    table.string('employee_number').unique();
    table.enum('employment_type', ['full_time', 'part_time', 'contract', 'intern']).defaultTo('full_time');
    table.enum('department', [
      'operations',
      'sales',
      'technical',
      'administrative',
      'management',
      'logistics',
      'customer_service'
    ]).defaultTo('operations');
    table.string('job_title');
    table.date('hire_date');
    table.date('termination_date');
    table.enum('employment_status', ['active', 'on_leave', 'terminated', 'suspended']).defaultTo('active');
    table.decimal('hourly_rate', 10, 2);
    table.decimal('salary', 12, 2);
    table.string('emergency_contact_name');
    table.string('emergency_contact_phone');
    table.text('skills'); // JSON array
    table.text('certifications'); // JSON array
    table.text('bio');
    table.date('birth_date');
    table.jsonb('schedule_preferences').defaultTo('{}'); // { preferred_shifts, days_off, max_hours }
    table.boolean('can_drive').defaultTo(false);
    table.string('drivers_license_number');
    table.date('drivers_license_expiry');
    table.timestamps(true, true);
    table.index(['department', 'employment_status']);
    table.index(['job_title']);
  });

  // Team Assignments (bookings/projects to employees)
  await knex.schema.createTable('team_assignments', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('employee_id').references('id').inTable('employee_profiles').onDelete('CASCADE').notNullable();
    table.enum('assignable_type', ['booking', 'project', 'maintenance_task', 'delivery']).notNullable();
    table.uuid('assignable_id').notNullable();
    table.enum('role', [
      'lead',
      'assistant',
      'driver',
      'technician',
      'coordinator',
      'support',
      'observer'
    ]).defaultTo('support');
    table.text('responsibilities');
    table.timestamp('scheduled_start');
    table.timestamp('scheduled_end');
    table.timestamp('actual_start');
    table.timestamp('actual_end');
    table.enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']).defaultTo('scheduled');
    table.text('notes');
    table.uuid('assigned_by').references('id').inTable('users');
    table.timestamps(true, true);
    table.index(['employee_id', 'status']);
    table.index(['assignable_type', 'assignable_id']);
    table.index(['scheduled_start', 'scheduled_end']);
  });

  // Employee Availability/Time Off
  await knex.schema.createTable('employee_availability', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('employee_id').references('id').inTable('employee_profiles').onDelete('CASCADE').notNullable();
    table.date('date').notNullable();
    table.enum('status', ['available', 'unavailable', 'time_off', 'partial']).defaultTo('available');
    table.time('available_from');
    table.time('available_until');
    table.enum('time_off_type', ['vacation', 'sick', 'personal', 'training', 'other']);
    table.text('notes');
    table.uuid('approved_by').references('id').inTable('users');
    table.timestamp('approved_at');
    table.timestamps(true, true);
    table.unique(['employee_id', 'date']);
  });

  // Employee Skills/Certifications Master List
  await knex.schema.createTable('skill_catalog', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique();
    table.text('description');
    table.enum('category', ['technical', 'creative', 'logistics', 'administrative', 'safety']);
    table.boolean('is_certification').defaultTo(false);
    table.boolean('requires_renewal').defaultTo(false);
    table.integer('renewal_period_months');
    table.timestamps(true, true);
  });

  // Employee Skills (junction table)
  await knex.schema.createTable('employee_skills', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('employee_id').references('id').inTable('employee_profiles').onDelete('CASCADE').notNullable();
    table.uuid('skill_id').references('id').inTable('skill_catalog').onDelete('CASCADE').notNullable();
    table.enum('proficiency', ['beginner', 'intermediate', 'advanced', 'expert']).defaultTo('beginner');
    table.date('acquired_date');
    table.date('expiry_date'); // For certifications
    table.string('certificate_number');
    table.text('certificate_url');
    table.uuid('verified_by').references('id').inTable('users');
    table.timestamps(true, true);
    table.unique(['employee_id', 'skill_id']);
  });

  // Team Performance Metrics
  await knex.schema.createTable('employee_performance', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('employee_id').references('id').inTable('employee_profiles').onDelete('CASCADE').notNullable();
    table.enum('period', ['weekly', 'monthly', 'quarterly', 'yearly']).notNullable();
    table.date('period_start').notNullable();
    table.date('period_end').notNullable();
    table.integer('bookings_handled').defaultTo(0);
    table.integer('projects_completed').defaultTo(0);
    table.decimal('customer_rating', 3, 2); // 1.00 - 5.00
    table.integer('incidents_reported').defaultTo(0);
    table.integer('incidents_resolved').defaultTo(0);
    table.integer('hours_worked').defaultTo(0);
    table.decimal('revenue_contributed', 12, 2).defaultTo(0);
    table.text('notes');
    table.uuid('reviewed_by').references('id').inTable('users');
    table.timestamp('reviewed_at');
    table.timestamps(true, true);
    table.unique(['employee_id', 'period', 'period_start']);
  });

  // Insert default skills
  await knex('skill_catalog').insert([
    { name: 'Camera Operation', category: 'technical', description: 'Professional camera operation' },
    { name: 'Lighting Setup', category: 'technical', description: 'Studio and location lighting' },
    { name: 'Audio Recording', category: 'technical', description: 'Audio capture and monitoring' },
    { name: 'Drone Piloting', category: 'technical', is_certification: true, requires_renewal: true, renewal_period_months: 24 },
    { name: 'Forklift Operation', category: 'logistics', is_certification: true, requires_renewal: true, renewal_period_months: 36 },
    { name: 'CDL License', category: 'logistics', is_certification: true, requires_renewal: true, renewal_period_months: 60 },
    { name: 'First Aid/CPR', category: 'safety', is_certification: true, requires_renewal: true, renewal_period_months: 24 },
    { name: 'Video Editing', category: 'creative', description: 'Post-production editing' },
    { name: 'Color Grading', category: 'creative', description: 'Professional color correction' },
    { name: 'Equipment Maintenance', category: 'technical', description: 'Gear cleaning and basic repairs' }
  ]);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('employee_performance');
  await knex.schema.dropTableIfExists('employee_skills');
  await knex.schema.dropTableIfExists('skill_catalog');
  await knex.schema.dropTableIfExists('employee_availability');
  await knex.schema.dropTableIfExists('team_assignments');
  await knex.schema.dropTableIfExists('employee_profiles');
};
