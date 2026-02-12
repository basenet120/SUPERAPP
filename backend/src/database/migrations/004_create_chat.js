exports.up = async function(knex) {
  // Chat Channels
  await knex.schema.createTable('chat_channels', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('slug').unique();
    table.enum('type', ['public', 'private', 'direct', 'project']).defaultTo('public');
    table.text('description');
    table.text('topic');
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('project_id').references('id').inTable('projects').onDelete('SET NULL');
    table.boolean('archived').defaultTo(false);
    table.timestamp('archived_at');
    table.timestamps(true, true);
  });

  // Channel Members
  await knex.schema.createTable('channel_members', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('channel_id').references('id').inTable('chat_channels').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.enum('role', ['owner', 'admin', 'member']).defaultTo('member');
    table.timestamp('last_read_at');
    table.boolean('notifications_enabled').defaultTo(true);
    table.enum('notification_preference', ['all', 'mentions', 'none']).defaultTo('all');
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.uuid('invited_by').references('id').inTable('users');
    table.unique(['channel_id', 'user_id']);
  });

  // Chat Messages
  await knex.schema.createTable('chat_messages', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('channel_id').references('id').inTable('chat_channels').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.enum('type', ['text', 'image', 'file', 'system', 'thread_start']).defaultTo('text');
    table.text('content');
    table.jsonb('attachments').defaultTo('[]');
    table.uuid('parent_id').references('id').inTable('chat_messages').onDelete('CASCADE');
    table.uuid('thread_id').references('id').inTable('chat_messages');
    table.boolean('edited').defaultTo(false);
    table.timestamp('edited_at');
    table.boolean('deleted').defaultTo(false);
    table.timestamp('deleted_at');
    table.uuid('deleted_by').references('id').inTable('users');
    table.timestamps(true, true);
    table.index(['channel_id', 'created_at']);
    table.index(['thread_id']);
  });

  // Message Reactions
  await knex.schema.createTable('message_reactions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('message_id').references('id').inTable('chat_messages').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('emoji').notNullable();
    table.timestamps(true, true);
    table.unique(['message_id', 'user_id', 'emoji']);
  });

  // Message Mentions
  await knex.schema.createTable('message_mentions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('message_id').references('id').inTable('chat_messages').onDelete('CASCADE');
    table.uuid('mentioned_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.boolean('read').defaultTo(false);
    table.timestamp('read_at');
    table.timestamps(true, true);
  });

  // User Presence/Status
  await knex.schema.createTable('user_presence', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
    table.enum('status', ['online', 'away', 'busy', 'offline']).defaultTo('offline');
    table.text('status_message');
    table.timestamp('last_active_at').defaultTo(knex.fn.now());
    table.string('current_channel_id');
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('user_presence');
  await knex.schema.dropTableIfExists('message_mentions');
  await knex.schema.dropTableIfExists('message_reactions');
  await knex.schema.dropTableIfExists('chat_messages');
  await knex.schema.dropTableIfExists('channel_members');
  await knex.schema.dropTableIfExists('chat_channels');
};
