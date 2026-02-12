const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');

/**
 * Enhanced Client Model
 * Includes tier management, notes, tags, and communication history
 */
class ClientModelEnhanced {
  /**
   * Find client by ID with all enhancements
   * @param {string} id - Client ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const client = await db('clients')
      .leftJoin('companies', 'clients.company_id', 'companies.id')
      .where('clients.id', id)
      .whereNull('clients.deleted_at')
      .select(
        'clients.*',
        'companies.name as company_name'
      )
      .first();

    if (!client) return null;

    // Get tags
    const tags = await this.getTags(id);
    
    // Get notes
    const notes = await this.getNotes(id);
    
    // Get recent communications
    const communications = await this.getRecentCommunications(id, 5);

    return {
      ...this.formatClient(client),
      tags,
      notes,
      recentCommunications: communications
    };
  }

  /**
   * Get client tags
   * @param {string} clientId - Client ID
   * @returns {Promise<Array>}
   */
  static async getTags(clientId) {
    return db('client_tag_relations')
      .join('client_tags', 'client_tag_relations.tag_id', 'client_tags.id')
      .where('client_tag_relations.client_id', clientId)
      .select('client_tags.*');
  }

  /**
   * Add tag to client
   * @param {string} clientId - Client ID
   * @param {string} tagId - Tag ID
   * @param {string} addedBy - User ID
   */
  static async addTag(clientId, tagId, addedBy) {
    await db('client_tag_relations')
      .insert({
        client_id: clientId,
        tag_id: tagId,
        added_by: addedBy
      })
      .onConflict(['client_id', 'tag_id'])
      .ignore();
  }

  /**
   * Remove tag from client
   * @param {string} clientId - Client ID
   * @param {string} tagId - Tag ID
   */
  static async removeTag(clientId, tagId) {
    await db('client_tag_relations')
      .where({ client_id: clientId, tag_id: tagId })
      .delete();
  }

  /**
   * Get client notes
   * @param {string} clientId - Client ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>}
   */
  static async getNotes(clientId, filters = {}) {
    const query = db('client_notes')
      .leftJoin('users', 'client_notes.created_by', 'users.id')
      .where('client_notes.client_id', clientId)
      .orderBy('client_notes.is_pinned', 'desc')
      .orderBy('client_notes.created_at', 'desc');

    if (filters.type) {
      query.where('client_notes.type', filters.type);
    }

    if (filters.isPinned !== undefined) {
      query.where('client_notes.is_pinned', filters.isPinned);
    }

    return query.select(
      'client_notes.*',
      db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'System') as created_by_name")
    );
  }

  /**
   * Add note to client
   * @param {Object} data - Note data
   * @returns {Promise<Object>}
   */
  static async addNote(data) {
    const [note] = await db('client_notes')
      .insert({
        client_id: data.clientId,
        content: data.content,
        type: data.type || 'general',
        is_private: data.isPrivate || false,
        is_pinned: data.isPinned || false,
        created_by: data.createdBy
      })
      .returning('*');

    return note;
  }

  /**
   * Update note
   * @param {string} noteId - Note ID
   * @param {Object} data - Update data
   */
  static async updateNote(noteId, data) {
    const updateData = {};
    if (data.content) updateData.content = data.content;
    if (data.type) updateData.type = data.type;
    if (data.isPrivate !== undefined) updateData.is_private = data.isPrivate;
    if (data.isPinned !== undefined) updateData.is_pinned = data.isPinned;

    const [note] = await db('client_notes')
      .where({ id: noteId })
      .update(updateData)
      .returning('*');

    if (!note) {
      throw new NotFoundError('Note');
    }

    return note;
  }

  /**
   * Delete note
   * @param {string} noteId - Note ID
   */
  static async deleteNote(noteId) {
    const result = await db('client_notes')
      .where({ id: noteId })
      .delete();

    if (result === 0) {
      throw new NotFoundError('Note');
    }
  }

  /**
   * Log communication
   * @param {Object} data - Communication data
   * @returns {Promise<Object>}
   */
  static async logCommunication(data) {
    const [communication] = await db('client_communications')
      .insert({
        client_id: data.clientId,
        type: data.type,
        direction: data.direction,
        subject: data.subject,
        content: data.content,
        metadata: JSON.stringify(data.metadata || {}),
        related_booking_id: data.relatedBookingId,
        related_deal_id: data.relatedDealId,
        created_by: data.createdBy
      })
      .returning('*');

    return communication;
  }

  /**
   * Get client communications
   * @param {string} clientId - Client ID
   * @param {Object} filters - Optional filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async getCommunications(clientId, filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = db('client_communications')
      .leftJoin('users', 'client_communications.created_by', 'users.id')
      .leftJoin('bookings', 'client_communications.related_booking_id', 'bookings.id')
      .where('client_communications.client_id', clientId)
      .orderBy('client_communications.created_at', 'desc');

    if (filters.type) {
      query.where('client_communications.type', filters.type);
    }

    if (filters.direction) {
      query.where('client_communications.direction', filters.direction);
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [countResult, rows] = await Promise.all([
      query.clone().count('* as count').first(),
      query
        .select(
          'client_communications.*',
          db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'System') as created_by_name"),
          'bookings.booking_number as related_booking_number'
        )
        .limit(pagination.limit)
        .offset(offset)
    ]);

    return {
      data: rows.map(row => ({
        ...row,
        metadata: JSON.parse(row.metadata || '{}')
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      }
    };
  }

  /**
   * Get recent communications
   * @param {string} clientId - Client ID
   * @param {number} limit - Number to return
   * @returns {Promise<Array>}
   */
  static async getRecentCommunications(clientId, limit = 5) {
    const communications = await db('client_communications')
      .leftJoin('users', 'client_communications.created_by', 'users.id')
      .where('client_communications.client_id', clientId)
      .orderBy('client_communications.created_at', 'desc')
      .limit(limit)
      .select(
        'client_communications.*',
        db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'System') as created_by_name")
      );

    return communications.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata || '{}')
    }));
  }

  /**
   * Update client spend and check for tier upgrade
   * @param {string} clientId - Client ID
   * @param {number} amount - Amount to add to spend
   * @returns {Promise<Object>}
   */
  static async updateSpend(clientId, amount) {
    const client = await db('clients').where('id', clientId).first();
    if (!client) {
      throw new NotFoundError('Client');
    }

    const newSpend = parseFloat(client.lifetime_spend || 0) + amount;
    const newBookings = (client.total_bookings || 0) + 1;

    // Check for tier upgrade
    const newTier = await this.calculateTier(newSpend, newBookings);
    
    const updateData = {
      lifetime_spend: newSpend,
      total_bookings: newBookings
    };

    if (newTier !== client.tier) {
      updateData.tier = newTier;
      updateData.tier_assigned_at = new Date();

      // Log tier change
      await db('client_tier_history').insert({
        client_id: clientId,
        from_tier: client.tier,
        to_tier: newTier,
        spend_at_change: newSpend,
        reason: `Automatic upgrade based on spend and bookings`
      });

      // Get new tier benefits
      const tierConfig = await db('tier_config').where('tier', newTier).first();
      if (tierConfig) {
        updateData.tier_benefits = tierConfig.benefits;
      }
    }

    await db('clients').where('id', clientId).update(updateData);

    return {
      clientId,
      previousSpend: client.lifetime_spend,
      newSpend,
      previousTier: client.tier,
      newTier,
      tierChanged: newTier !== client.tier
    };
  }

  /**
   * Calculate tier based on spend and bookings
   * @param {number} spend - Lifetime spend
   * @param {number} bookings - Total bookings
   * @returns {Promise<string>}
   */
  static async calculateTier(spend, bookings) {
    const tiers = await db('tier_config')
      .orderBy('min_spend', 'desc');

    for (const tier of tiers) {
      if (spend >= tier.min_spend && bookings >= tier.min_bookings) {
        return tier.tier;
      }
    }

    return 'bronze';
  }

  /**
   * Manually set client tier
   * @param {string} clientId - Client ID
   * @param {string} tier - New tier
   * @param {string} userId - User making the change
   * @param {string} reason - Reason for change
   */
  static async setTier(clientId, tier, userId, reason = null) {
    const client = await db('clients').where('id', clientId).first();
    if (!client) {
      throw new NotFoundError('Client');
    }

    if (client.tier === tier) {
      return { changed: false, message: 'Client already at this tier' };
    }

    // Get tier benefits
    const tierConfig = await db('tier_config').where('tier', tier).first();

    await db.transaction(async (trx) => {
      // Update client
      await trx('clients')
        .where('id', clientId)
        .update({
          tier,
          tier_assigned_at: new Date(),
          tier_benefits: tierConfig ? tierConfig.benefits : '{}'
        });

      // Log tier change
      await trx('client_tier_history').insert({
        client_id: clientId,
        from_tier: client.tier,
        to_tier: tier,
        spend_at_change: client.lifetime_spend,
        reason: reason || 'Manual tier assignment',
        changed_by: userId
      });
    });

    return {
      changed: true,
      previousTier: client.tier,
      newTier: tier
    };
  }

  /**
   * Get tier benefits
   * @param {string} tier - Tier name
   * @returns {Promise<Object>}
   */
  static async getTierBenefits(tier) {
    const config = await db('tier_config').where('tier', tier).first();
    if (!config) return null;

    return {
      ...config,
      benefits: JSON.parse(config.benefits || '{}')
    };
  }

  /**
   * Get all tier configs
   * @returns {Promise<Array>}
   */
  static async getAllTiers() {
    const tiers = await db('tier_config').orderBy('min_spend', 'asc');
    return tiers.map(t => ({
      ...t,
      benefits: JSON.parse(t.benefits || '{}')
    }));
  }

  /**
   * Get tier history for client
   * @param {string} clientId - Client ID
   * @returns {Promise<Array>}
   */
  static async getTierHistory(clientId) {
    return db('client_tier_history')
      .leftJoin('users', 'client_tier_history.changed_by', 'users.id')
      .where('client_tier_history.client_id', clientId)
      .orderBy('client_tier_history.created_at', 'desc')
      .select(
        'client_tier_history.*',
        db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'System') as changed_by_name")
      );
  }

  /**
   * Search clients with filters
   * @param {Object} filters - Search filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async search(filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = db('clients')
      .leftJoin('companies', 'clients.company_id', 'companies.id')
      .whereNull('clients.deleted_at');

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query.where(function() {
        this.where('clients.contact_name', 'ilike', searchTerm)
          .orWhere('clients.email', 'ilike', searchTerm)
          .orWhere('clients.company_name', 'ilike', searchTerm)
          .orWhere('companies.name', 'ilike', searchTerm);
      });
    }

    if (filters.tier) {
      query.where('clients.tier', filters.tier);
    }

    if (filters.companyId) {
      query.where('clients.company_id', filters.companyId);
    }

    if (filters.tags && filters.tags.length > 0) {
      query.whereExists(function() {
        this.select('*')
          .from('client_tag_relations')
          .whereRaw('client_tag_relations.client_id = clients.id')
          .whereIn('client_tag_relations.tag_id', filters.tags);
      });
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [countResult, rows] = await Promise.all([
      query.clone().count('* as count').first(),
      query
        .select(
          'clients.*',
          'companies.name as company_name'
        )
        .orderBy('clients.created_at', 'desc')
        .limit(pagination.limit)
        .offset(offset)
    ]);

    return {
      data: rows.map(this.formatClient),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      }
    };
  }

  /**
   * Get client statistics
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>}
   */
  static async getStatistics(clientId) {
    const [bookingStats, communicationStats] = await Promise.all([
      db('bookings')
        .where('client_id', clientId)
        .whereNull('deleted_at')
        .select(
          db.raw('COUNT(*) as total_bookings'),
          db.raw('SUM(total_amount) as total_revenue'),
          db.raw("COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings"),
          db.raw("COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings")
        )
        .first(),
      db('client_communications')
        .where('client_id', clientId)
        .select(
          db.raw('COUNT(*) as total_communications'),
          db.raw("COUNT(*) FILTER (WHERE type = 'email') as email_count"),
          db.raw("COUNT(*) FILTER (WHERE type = 'phone') as phone_count")
        )
        .first()
    ]);

    return {
      bookings: bookingStats || {},
      communications: communicationStats || {}
    };
  }

  /**
   * Format client object
   * @param {Object} client - Raw client data
   * @returns {Object} Formatted client
   */
  static formatClient(client) {
    return {
      ...client,
      tierBenefits: client.tier_benefits ? JSON.parse(client.tier_benefits) : {},
      lifetimeSpend: parseFloat(client.lifetime_spend || 0),
      totalBookings: client.total_bookings || 0
    };
  }
}

module.exports = ClientModelEnhanced;
