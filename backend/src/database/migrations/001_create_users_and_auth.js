exports.up = async function(knex) {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // Users table
  await knex.schema.createTable('users', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email').unique().notNullable().index();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('phone');
    table.text('avatar_url');
    table.enum('status', ['active', 'inactive', 'suspended', 'pending']).defaultTo('pending');
    table.boolean('email_verified').defaultTo(false);
    table.string('email_verification_token');
    table.timestamp('email_verified_at');
    table.string('password_reset_token');
    table.timestamp('password_reset_expires');
    table.timestamp('last_login_at');
    table.string('last_login_ip');
    table.boolean('two_factor_enabled').defaultTo(false);
    table.string('two_factor_secret');
    table.text('notification_preferences').defaultTo('{}');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
  });

  // Roles table
  await knex.schema.createTable('roles', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').unique().notNullable();
    table.string('slug').unique().notNullable();
    table.text('description');
    table.integer('level').defaultTo(0);
    table.timestamps(true, true);
  });

  // Permissions table
  await knex.schema.createTable('permissions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').unique().notNullable();
    table.string('slug').unique().notNullable();
    table.string('resource').notNullable();
    table.string('action').notNullable();
    table.text('description');
    table.timestamps(true, true);
  });

  // User roles (many-to-many)
  await knex.schema.createTable('user_roles', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.uuid('assigned_by').references('id').inTable('users');
    table.timestamp('expires_at');
    table.timestamps(true, true);
    table.unique(['user_id', 'role_id']);
  });

  // Role permissions (many-to-many)
  await knex.schema.createTable('role_permissions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.uuid('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
    table.timestamps(true, true);
    table.unique(['role_id', 'permission_id']);
  });

  // User permissions (direct assignment, overrides)
  await knex.schema.createTable('user_permissions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
    table.enum('type', ['grant', 'deny']).defaultTo('grant');
    table.timestamps(true, true);
    table.unique(['user_id', 'permission_id']);
  });

  // Refresh tokens
  await knex.schema.createTable('refresh_tokens', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('token').notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.string('ip_address');
    table.string('user_agent');
    table.boolean('revoked').defaultTo(false);
    table.timestamp('revoked_at');
    table.uuid('replaced_by');
    table.timestamps(true, true);
  });

  // Audit log
  await knex.schema.createTable('audit_logs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users');
    table.string('action').notNullable().index();
    table.string('resource').notNullable();
    table.uuid('resource_id');
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.string('ip_address');
    table.string('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Create indexes
  await knex.raw('CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC)');
  await knex.raw('CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('user_permissions');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
};
