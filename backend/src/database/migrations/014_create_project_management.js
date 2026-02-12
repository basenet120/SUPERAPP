exports.up = async function(knex) {
  // Projects table
  await knex.schema.createTable('projects', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.text('description');
    table.uuid('client_id').references('id').inTable('clients').onDelete('SET NULL');
    table.uuid('company_id').references('id').inTable('companies').onDelete('SET NULL');
    
    // Project metadata
    table.enum('status', ['planning', 'active', 'on_hold', 'completed', 'cancelled']).defaultTo('planning');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.enum('type', ['production', 'event', 'corporate', 'documentary', 'commercial', 'other']).defaultTo('production');
    
    // Budget and financial
    table.decimal('budget', 12, 2);
    table.decimal('actual_cost', 12, 2).defaultTo(0);
    
    // Timeline
    table.date('start_date');
    table.date('end_date');
    table.date('actual_start_date');
    table.date('actual_end_date');
    
    // Project manager
    table.uuid('project_manager_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Progress tracking
    table.integer('progress_percentage').defaultTo(0);
    table.text('notes');
    
    // Related booking
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    
    table.timestamps(true, true);
    table.index(['client_id']);
    table.index(['status']);
    table.index(['project_manager_id']);
    table.index(['start_date', 'end_date']);
  });

  // Milestones table
  await knex.schema.createTable('milestones', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable();
    
    table.string('name').notNullable();
    table.text('description');
    table.date('due_date').notNullable();
    table.date('completed_date');
    table.enum('status', ['pending', 'in_progress', 'completed', 'delayed']).defaultTo('pending');
    
    // Dependencies (stored as JSON array of milestone IDs)
    table.jsonb('dependencies').defaultTo('[]');
    
    // Deliverables
    table.jsonb('deliverables').defaultTo('[]');
    
    table.integer('order_index').defaultTo(0);
    table.timestamps(true, true);
    table.index(['project_id', 'status']);
    table.index(['due_date']);
  });

  // Tasks table
  await knex.schema.createTable('tasks', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable();
    table.uuid('milestone_id').references('id').inTable('milestones').onDelete('SET NULL');
    
    table.string('title').notNullable();
    table.text('description');
    table.enum('status', ['todo', 'in_progress', 'review', 'completed', 'cancelled']).defaultTo('todo');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    
    // Assignment
    table.uuid('assignee_id').references('id').inTable('employee_profiles').onDelete('SET NULL');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Timeline
    table.date('start_date');
    table.date('due_date');
    table.date('completed_date');
    table.integer('estimated_hours');
    table.integer('actual_hours');
    
    // Dependencies
    table.jsonb('dependencies').defaultTo('[]');
    table.uuid('parent_task_id').references('id').inTable('tasks').onDelete('CASCADE');
    
    // Position for kanban
    table.integer('position').defaultTo(0);
    table.string('tags');
    
    table.timestamps(true, true);
    table.index(['project_id', 'status']);
    table.index(['assignee_id']);
    table.index(['milestone_id']);
    table.index(['due_date']);
  });

  // Project team assignments
  await knex.schema.createTable('project_members', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable();
    table.uuid('employee_id').references('id').inTable('employee_profiles').onDelete('CASCADE').notNullable();
    
    table.enum('role', ['manager', 'lead', 'member', 'consultant', 'client']).defaultTo('member');
    table.text('responsibilities');
    table.date('joined_date').defaultTo(knex.fn.now());
    table.date('left_date');
    
    table.timestamps(true, true);
    table.unique(['project_id', 'employee_id']);
  });

  // Task comments/activity
  await knex.schema.createTable('task_comments', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    
    table.text('content').notNullable();
    table.enum('type', ['comment', 'status_change', 'assignment', 'time_logged']).defaultTo('comment');
    table.jsonb('metadata');
    
    table.timestamps(true, true);
    table.index(['task_id', 'created_at']);
  });

  // Time tracking on tasks
  await knex.schema.createTable('task_time_entries', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE').notNullable();
    table.uuid('employee_id').references('id').inTable('employee_profiles').onDelete('CASCADE').notNullable();
    
    table.timestamp('started_at').notNullable();
    table.timestamp('ended_at');
    table.integer('duration_minutes');
    table.text('description');
    table.boolean('billable').defaultTo(true);
    
    table.timestamps(true, true);
    table.index(['task_id']);
    table.index(['employee_id', 'started_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('task_time_entries');
  await knex.schema.dropTableIfExists('task_comments');
  await knex.schema.dropTableIfExists('project_members');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('milestones');
  await knex.schema.dropTableIfExists('projects');
};
