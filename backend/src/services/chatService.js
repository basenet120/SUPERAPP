const db = require('../config/database');
const { getRedis } = require('../config/redis');
const logger = require('../utils/logger');

class ChatService {
  constructor(io) {
    this.io = io;
    this.redis = getRedis();
  }

  /**
   * Create a new channel
   * @param {Object} data - Channel data
   * @returns {Promise<Object>} Created channel
   */
  async createChannel(data) {
    const { name, type = 'public', description, createdBy, projectId } = data;

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const [channel] = await db('chat_channels')
      .insert({
        name,
        slug: `${slug}-${Date.now()}`,
        type,
        description,
        created_by: createdBy,
        project_id: projectId
      })
      .returning('*');

    // Add creator as owner
    await db('channel_members').insert({
      channel_id: channel.id,
      user_id: createdBy,
      role: 'owner'
    });

    return channel;
  }

  /**
   * Get channels for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Channels
   */
  async getUserChannels(userId) {
    return db('chat_channels')
      .leftJoin('channel_members', 'chat_channels.id', 'channel_members.channel_id')
      .where('channel_members.user_id', userId)
      .orWhere('chat_channels.type', 'public')
      .whereNull('chat_channels.archived_at')
      .select(
        'chat_channels.*',
        'channel_members.role',
        'channel_members.last_read_at',
        'channel_members.notifications_enabled'
      )
      .orderBy('chat_channels.created_at', 'desc');
  }

  /**
   * Get channel messages
   * @param {string} channelId - Channel ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Messages
   */
  async getChannelMessages(channelId, options = {}) {
    const { limit = 50, before } = options;

    const query = db('chat_messages')
      .leftJoin('users', 'chat_messages.user_id', 'users.id')
      .where('chat_messages.channel_id', channelId)
      .whereNull('chat_messages.deleted_at')
      .whereNull('chat_messages.parent_id') // Top level only
      .orderBy('chat_messages.created_at', 'desc')
      .limit(limit)
      .select(
        'chat_messages.*',
        db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'Unknown') as user_name"),
        'users.avatar_url as user_avatar'
      );

    if (before) {
      query.where('chat_messages.created_at', '<', before);
    }

    return query;
  }

  /**
   * Send message
   * @param {Object} data - Message data
   * @returns {Promise<Object>} Created message
   */
  async sendMessage(data) {
    const { channelId, userId, content, type = 'text', attachments = [], parentId } = data;

    const [message] = await db('chat_messages')
      .insert({
        channel_id: channelId,
        user_id: userId,
        content,
        type,
        attachments: JSON.stringify(attachments),
        parent_id: parentId
      })
      .returning('*');

    // Get user info
    const user = await db('users')
      .where({ id: userId })
      .select('first_name', 'last_name', 'avatar_url')
      .first();

    const messageWithUser = {
      ...message,
      user_name: `${user.first_name} ${user.last_name}`,
      user_avatar: user.avatar_url
    };

    // Parse mentions
    const mentions = this.parseMentions(content);
    for (const mention of mentions) {
      await db('message_mentions').insert({
        message_id: message.id,
        mentioned_user_id: mention.userId
      });

      // Send notification
      this.io.to(`user:${mention.userId}`).emit('mention', {
        message: messageWithUser,
        channelId
      });
    }

    // Broadcast to channel
    this.io.to(`channel:${channelId}`).emit('new_message', messageWithUser);

    // Update unread counts for offline members
    const members = await db('channel_members')
      .where({ channel_id: channelId })
      .whereNot('user_id', userId)
      .pluck('user_id');

    for (const memberId of members) {
      await this.redis.incr(`unread:${memberId}:${channelId}`);
    }

    return messageWithUser;
  }

  /**
   * Add reaction to message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @param {string} emoji - Emoji
   * @returns {Promise<Object>} Reaction result
   */
  async addReaction(messageId, userId, emoji) {
    await db('message_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        emoji
      })
      .onConflict(['message_id', 'user_id', 'emoji'])
      .ignore();

    // Get updated reactions
    const reactions = await db('message_reactions')
      .where({ message_id: messageId })
      .select('emoji', db.raw('COUNT(*) as count'))
      .groupBy('emoji');

    // Broadcast update
    this.io.emit('reaction_update', { messageId, reactions });

    return reactions;
  }

  /**
   * Remove reaction from message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @param {string} emoji - Emoji
   * @returns {Promise<Object>} Reaction result
   */
  async removeReaction(messageId, userId, emoji) {
    await db('message_reactions')
      .where({
        message_id: messageId,
        user_id: userId,
        emoji
      })
      .delete();

    const reactions = await db('message_reactions')
      .where({ message_id: messageId })
      .select('emoji', db.raw('COUNT(*) as count'))
      .groupBy('emoji');

    this.io.emit('reaction_update', { messageId, reactions });

    return reactions;
  }

  /**
   * Mark channel as read for user
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   */
  async markAsRead(channelId, userId) {
    await db('channel_members')
      .where({ channel_id: channelId, user_id: userId })
      .update({ last_read_at: new Date() });

    await this.redis.del(`unread:${userId}:${channelId}`);
  }

  /**
   * Get unread count for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Unread counts
   */
  async getUnreadCounts(userId) {
    const channels = await db('channel_members')
      .where({ user_id: userId })
      .pluck('channel_id');

    const counts = {};
    for (const channelId of channels) {
      const count = await this.redis.get(`unread:${userId}:${channelId}`);
      counts[channelId] = parseInt(count) || 0;
    }

    return counts;
  }

  /**
   * Join channel
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   * @param {string} invitedBy - Inviting user ID (optional)
   */
  async joinChannel(channelId, userId, invitedBy = null) {
    await db('channel_members')
      .insert({
        channel_id: channelId,
        user_id: userId,
        invited_by: invitedBy
      })
      .onConflict(['channel_id', 'user_id'])
      .ignore();

    // Notify channel
    this.io.to(`channel:${channelId}`).emit('user_joined', { userId, channelId });
  }

  /**
   * Leave channel
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   */
  async leaveChannel(channelId, userId) {
    await db('channel_members')
      .where({ channel_id: channelId, user_id: userId })
      .delete();

    this.io.to(`channel:${channelId}`).emit('user_left', { userId, channelId });
  }

  /**
   * Search messages
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Messages
   */
  async searchMessages(query, options = {}) {
    const { channelId, userId, limit = 20 } = options;

    const dbQuery = db('chat_messages')
      .leftJoin('users', 'chat_messages.user_id', 'users.id')
      .leftJoin('chat_channels', 'chat_messages.channel_id', 'chat_channels.id')
      .where('chat_messages.content', 'ilike', `%${query}%`)
      .whereNull('chat_messages.deleted_at')
      .orderBy('chat_messages.created_at', 'desc')
      .limit(limit)
      .select(
        'chat_messages.*',
        db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'Unknown') as user_name"),
        'chat_channels.name as channel_name'
      );

    if (channelId) {
      dbQuery.where('chat_messages.channel_id', channelId);
    }

    if (userId) {
      // Filter to channels user is member of
      const userChannels = await db('channel_members')
        .where('user_id', userId)
        .pluck('channel_id');

      dbQuery.whereIn('chat_messages.channel_id', userChannels);
    }

    return dbQuery;
  }

  /**
   * Parse @mentions from message content
   * @param {string} content - Message content
   * @returns {Array} Mentions
   */
  parseMentions(content) {
    const mentionRegex = /@<([^>]+)>/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push({ userId: match[1] });
    }

    return mentions;
  }

  /**
   * Update user presence
   * @param {string} userId - User ID
   * @param {string} status - Status (online, away, busy, offline)
   * @param {string} currentChannel - Current channel ID
   */
  async updatePresence(userId, status, currentChannel = null) {
    await db('user_presence')
      .insert({
        user_id: userId,
        status,
        last_active_at: new Date(),
        current_channel_id: currentChannel
      })
      .onConflict('user_id')
      .merge();

    // Broadcast presence update
    this.io.emit('presence_update', { userId, status, currentChannel });
  }

  /**
   * Get channel members
   * @param {string} channelId - Channel ID
   * @returns {Promise<Array>} Members
   */
  async getChannelMembers(channelId) {
    return db('channel_members')
      .join('users', 'channel_members.user_id', 'users.id')
      .where('channel_members.channel_id', channelId)
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.avatar_url',
        'channel_members.role',
        'channel_members.joined_at'
      );
  }
}

module.exports = ChatService;
