exports.up = async function(knex) {
  // Employee Profiles
  await knex.schema.createTable('employee_profiles', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
    
    // Employment details
    table.string('employee_id').unique();
    table.date('hire_date');
    table.date('termination_date');
    table.enum('employment_type', ['full_time', 'part_time', 'contractor', 'intern']).defaultTo('full_time');
    table.enum('status', ['active', 'inactive', 'on_leave', 'terminated']).defaultTo('active');
    
    // Department and role
    table.string('department');
    table.string('job_title');
    table.uuid('manager_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Skills and certifications
    table.jsonb('skills').defaultTo('[]');
    table.jsonb('certifications').defaultTo('[]');
    table.jsonb('equipment_specializations').defaultTo('[]'); // Equipment categories they can handle
    
    // Contact and personal
    table.string('emergency_contact_name');
    table.string('emergency_contact_phone');
    table.text('address');
    table.date('birth_date');
    
    // Payroll (basic tracking)
    table.decimal('hourly_rate', 10, 2);
    table.decimal('salary', 12, 2);
    table.enum('pay_schedule', ['hourly', 'weekly', 'biweekly', 'monthly']).defaultTo('hourly');
    
    // Preferences
    table.jsonb('availability_schedule').defaultTo('{}'); // Weekly availability
    table.integer('max_hours_per_week');
    table.text('notes');
    
    table.timestamps(true, true);
    table.index(['user_id', 'status']);
    table.index(['department']);
    table.index(['manager_id']);
  });

  // Employee Skills Reference Table
  await knex.schema.createTable('skill_categories', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('slug').unique().notNullable();
    table.text('description');
    table.enum('type', ['technical', 'soft', 'certification', 'equipment']).defaultTo('technical');
    table.timestamps(true, true);
  });

  // Employee-Time Tracking (prep for payroll)
  await knex.schema.createTable('employee_time_entries', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('employee_id').references('id').inTable('employee_profiles').onDelete('CASCADE').notNullable();
    
    // Time tracking
    table.timestamp('clock_in').notNullable();
    table.timestamp('clock_out');
    table.specificType('duration', 'interval');
    
    // Categorization
    table.enum('type', ['regular', 'overtime', 'break', 'training', 'meeting', 'travel']).defaultTo('regular');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.uuid('project_id').references('id').inTable('projects').onDelete('SET NULL');
    
    // Location and verification
    table.jsonb('clock_in_location');
    table.jsonb('clock_out_location');
    table.string('ip_address');
    table.enum('verification_method', ['manual', 'gps', 'biometric', 'qr_code']).defaultTo('manual');
    
    // Approval
    table.enum('status', ['pending', 'approved', 'rejected', 'disputed']).defaultTo('pending');
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('approved_at');
    table.text('notes');
    table.text('rejection_reason');
    
    table.timestamps(true, true);
    table.index(['employee_id', 'clock_in']);
    table.index(['booking_id']);
    table.index(['status']);
  });

  // Employee Assignments to Bookings
  await knex.schema.createTable('booking_assignments', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE').notNullable();
    table.uuid('employee_id').references('id').inTable('employee_profiles').onDelete('CASCADE').notNullable();
    
    // Assignment details
    table.enum('role', ['prep_tech', 'delivery_driver', 'on_set_tech', 'supervisor', 'manager']).notNullable();
    table.text('responsibilities');
    table.timestamp('scheduled_start');
    table.timestamp('scheduled_end');
    
    // Status
    table.enum('status', ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']).defaultTo('scheduled');
    table.uuid('assigned_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Check-in/out
    table.timestamp('actual_start');
    table.timestamp('actual_end');
    table.text('check_in_notes');
    table.text('check_out_notes');
    
    table.timestamps(true, true);
    table.unique(['booking_id', 'employee_id', 'role']);
    table.index(['employee_id', 'scheduled_start']);
    table.index(['booking_id']);
  });

  // Employee Availability Calendar
  await knex.schema.createTable('employee_availability', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('employee_id').references('id').inTable('employee_profiles').onDelete('CASCADE').notNullable();
    
    // Date/time range
    table.date('date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    
    // Status
    table.enum('status', ['available', 'unavailable', 'tentative', 'booked']).defaultTo('available');
    table.enum('type', ['recurring', 'one_time']).defaultTo('one_time');
    
    // Optional reference
    table.string('reason'); // vacation, meeting, etc
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    
    table.timestamps(true, true);
    table.index(['employee_id', 'date']);
    table.index(['date', 'status']);
  });

  // Employee Documents (certifications, contracts, etc)
  await knex.schema.createTable('employee_documents', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('employee_id').references('id').inTable('employee_profiles').onDelete('CASCADE').notNullable();
    
    table.string('name').notNullable();
    table.enum('type', ['contract', 'certification', 'id_document', 'background_check', 'training_record', 'other']).notNullable();
    table.string('file_url').notNullable();
    table.string('file_name');
    table.string('mime_type');
    table.integer('file_size');
    
    // For certifications
    table.date('issue_date');
    table.date('expiry_date');
    table.string('issuing_organization');
    
    table.uuid('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    table.index(['employee_id', 'type']);
    table.index(['expiry_date']);
  });

  // Insert default skill categories
  await knex('skill_categories').insert([
    { name: 'Camera Operation', slug: 'camera-operation', type: 'technical' },
    { name: 'Lighting Setup', slug: 'lighting-setup', type: 'technical' },
    { name: 'Grip Work', slug: 'grip-work', type: 'technical' },
    { name: 'Audio Engineering', slug: 'audio-engineering', type: 'technical' },
    { name: 'Drone Piloting', slug: 'drone-piloting', type: 'certification' },
    { name: 'Forklift Operation', slug: 'forklift-operation', type: 'certification' },
    { name: 'CDL License', slug: 'cdl-license', type: 'certification' },
    { name: 'First Aid', slug: 'first-aid', type: 'certification' },
    { name: 'Project Management', slug: 'project-management', type: 'soft' },
    { name: 'Client Relations', slug: 'client-relations', type: 'soft' }
  ]);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('employee_documents');
  await knex.schema.dropTableIfExists('employee_availability');
  await knex.schema.dropTableIfExists('booking_assignments');
  await knex.schema.dropTableIfExists('employee_time_entries');
  await knex.schema.dropTableIfExists('skill_categories');
  await knex.schema.dropTableIfExists('employee_profiles');
};
