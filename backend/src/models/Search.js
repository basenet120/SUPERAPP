const db = require('../config/database');

/**
 * Search Model
 * Full-text search across all entities with faceted filtering
 */
class SearchModel {
  /**
   * Perform global search
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async search(query, filters = {}, pagination = { page: 1, limit: 20 }) {
    const searchQuery = db('search_index')
      .where('is_deleted', false)
      .orderBy('relevance_score', 'desc')
      .orderBy('entity_updated_at', 'desc');

    // Full-text search on title and content
    if (query && query.trim()) {
      const searchTerm = `%${query.toLowerCase()}%`;
      searchQuery.where(function() {
        this.whereRaw('LOWER(title) LIKE ?', [searchTerm])
          .orWhereRaw('LOWER(content) LIKE ?', [searchTerm]);
      });
    }

    // Entity type filter
    if (filters.entityTypes && filters.entityTypes.length > 0) {
      searchQuery.whereIn('entity_type', filters.entityTypes);
    }

    // Status filter
    if (filters.status) {
      searchQuery.where('status', filters.status);
    }

    // Category filter
    if (filters.category) {
      searchQuery.where('category', filters.category);
    }

    // Date range filter
    if (filters.dateFrom) {
      searchQuery.where('entity_date', '>=', filters.dateFrom);
    }
    if (filters.dateTo) {
      searchQuery.where('entity_date', '<=', filters.dateTo);
    }

    // Assigned to filter
    if (filters.assignedTo) {
      searchQuery.where('assigned_to', filters.assignedTo);
    }

    // Created by filter
    if (filters.createdBy) {
      searchQuery.where('created_by', filters.createdBy);
    }

    // Metadata filters (JSONB)
    if (filters.metadata) {
      Object.entries(filters.metadata).forEach(([key, value]) => {
        searchQuery.whereRaw(`metadata->>'${key}' = ?`, [value]);
      });
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [countResult, rows] = await Promise.all([
      searchQuery.clone().count('* as count').first(),
      searchQuery
        .limit(pagination.limit)
        .offset(offset)
    ]);

    // Get full entity details for results
    const enrichedResults = await Promise.all(
      rows.map(async (result) => {
        const entityDetails = await this.getEntityDetails(
          result.entity_type,
          result.entity_id
        );
        return {
          ...result,
          entity: entityDetails,
          metadata: result.metadata ? JSON.parse(result.metadata) : {}
        };
      })
    );

    return {
      data: enrichedResults,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      },
      facets: await this.getFacets(query, filters)
    };
  }

  /**
   * Get entity details by type and ID
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   */
  static async getEntityDetails(entityType, entityId) {
    try {
      switch (entityType) {
        case 'contact':
          return await this.getContactDetails(entityId);
        case 'company':
          return await this.getCompanyDetails(entityId);
        case 'booking':
          return await this.getBookingDetails(entityId);
        case 'equipment':
          return await this.getEquipmentDetails(entityId);
        case 'project':
          return await this.getProjectDetails(entityId);
        case 'task':
          return await this.getTaskDetails(entityId);
        case 'document':
          return await this.getDocumentDetails(entityId);
        case 'employee':
          return await this.getEmployeeDetails(entityId);
        case 'deal':
          return await this.getDealDetails(entityId);
        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Get contact details
   */
  static async getContactDetails(id) {
    return db('contacts')
      .leftJoin('companies', 'contacts.company_id', 'companies.id')
      .where('contacts.id', id)
      .select(
        'contacts.*',
        'companies.name as company_name'
      )
      .first();
  }

  /**
   * Get company details
   */
  static async getCompanyDetails(id) {
    return db('companies')
      .where('id', id)
      .first();
  }

  /**
   * Get booking details
   */
  static async getBookingDetails(id) {
    return db('bookings')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .where('bookings.id', id)
      .select(
        'bookings.*',
        'clients.contact_name as client_name'
      )
      .first();
  }

  /**
   * Get equipment details
   */
  static async getEquipmentDetails(id) {
    return db('equipment')
      .where('id', id)
      .first();
  }

  /**
   * Get project details
   */
  static async getProjectDetails(id) {
    return db('projects')
      .leftJoin('clients', 'projects.client_id', 'clients.id')
      .where('projects.id', id)
      .select(
        'projects.*',
        'clients.contact_name as client_name'
      )
      .first();
  }

  /**
   * Get task details
   */
  static async getTaskDetails(id) {
    return db('tasks')
      .leftJoin('projects', 'tasks.project_id', 'projects.id')
      .leftJoin('employee_profiles', 'tasks.assignee_id', 'employee_profiles.id')
      .leftJoin('users', 'employee_profiles.user_id', 'users.id')
      .where('tasks.id', id)
      .select(
        'tasks.*',
        'projects.name as project_name',
        db.raw("users.first_name || ' ' || users.last_name as assignee_name")
      )
      .first();
  }

  /**
   * Get document details
   */
  static async getDocumentDetails(id) {
    return db('documents')
      .leftJoin('clients', 'documents.client_id', 'clients.id')
      .leftJoin('companies', 'documents.company_id', 'companies.id')
      .where('documents.id', id)
      .whereNull('documents.deleted_at')
      .select(
        'documents.*',
        'clients.contact_name as client_name',
        'companies.name as company_name'
      )
      .first();
  }

  /**
   * Get employee details
   */
  static async getEmployeeDetails(id) {
    return db('employee_profiles')
      .leftJoin('users', 'employee_profiles.user_id', 'users.id')
      .where('employee_profiles.id', id)
      .select(
        'employee_profiles.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        db.raw("users.first_name || ' ' || users.last_name as name")
      )
      .first();
  }

  /**
   * Get deal details
   */
  static async getDealDetails(id) {
    return db('deals')
      .leftJoin('contacts', 'deals.contact_id', 'contacts.id')
      .leftJoin('companies', 'deals.company_id', 'companies.id')
      .where('deals.id', id)
      .select(
        'deals.*',
        'contacts.contact_name',
        'companies.name as company_name'
      )
      .first();
  }

  /**
   * Get search facets
   * @param {string} query - Search query
   * @param {Object} filters - Active filters
   */
  static async getFacets(query, filters = {}) {
    const baseQuery = db('search_index').where('is_deleted', false);

    if (query && query.trim()) {
      const searchTerm = `%${query.toLowerCase()}%`;
      baseQuery.where(function() {
        this.whereRaw('LOWER(title) LIKE ?', [searchTerm])
          .orWhereRaw('LOWER(content) LIKE ?', [searchTerm]);
      });
    }

    // Get entity type counts
    const entityTypes = await baseQuery.clone()
      .select('entity_type', db.raw('COUNT(*) as count'))
      .groupBy('entity_type');

    // Get status counts
    const statuses = await baseQuery.clone()
      .select('status', db.raw('COUNT(*) as count'))
      .whereNotNull('status')
      .groupBy('status');

    // Get category counts
    const categories = await baseQuery.clone()
      .select('category', db.raw('COUNT(*) as count'))
      .whereNotNull('category')
      .groupBy('category');

    return {
      entityTypes: entityTypes.map(e => ({ value: e.entity_type, count: parseInt(e.count) })),
      statuses: statuses.map(s => ({ value: s.status, count: parseInt(s.count) })),
      categories: categories.map(c => ({ value: c.category, count: parseInt(c.count) }))
    };
  }

  /**
   * Index an entity for search
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} data - Index data
   */
  static async indexEntity(entityType, entityId, data) {
    // Check if already indexed
    const existing = await db('search_index')
      .where({ entity_type: entityType, entity_id: entityId })
      .first();

    const indexData = {
      entity_type: entityType,
      entity_id: entityId,
      title: data.title,
      content: data.content,
      metadata: JSON.stringify(data.metadata || {}),
      status: data.status,
      category: data.category,
      entity_date: data.entityDate,
      assigned_to: data.assignedTo,
      created_by: data.createdBy,
      relevance_score: data.relevanceScore || 1.0,
      entity_created_at: data.createdAt,
      entity_updated_at: data.updatedAt || new Date(),
      indexed_at: new Date(),
      is_deleted: false
    };

    if (existing) {
      await db('search_index')
        .where({ id: existing.id })
        .update(indexData);
    } else {
      await db('search_index').insert(indexData);
    }
  }

  /**
   * Remove entity from search index
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   */
  static async unindexEntity(entityType, entityId) {
    await db('search_index')
      .where({ entity_type: entityType, entity_id: entityId })
      .update({
        is_deleted: true,
        deleted_at: new Date()
      });
  }

  /**
   * Log search query
   * @param {Object} data - Search query data
   */
  static async logSearchQuery(data) {
    return db('search_queries').insert({
      user_id: data.userId,
      query: data.query,
      filters: data.filters ? JSON.stringify(data.filters) : null,
      results_count: data.resultsCount,
      has_results: data.hasResults,
      execution_time_ms: data.executionTimeMs
    });
  }

  /**
   * Get search suggestions
   * @param {string} query - Partial query
   * @param {string} userId - User ID
   */
  static async getSuggestions(query, userId) {
    if (!query || query.length < 2) return [];

    const searchTerm = `%${query.toLowerCase()}%`;

    // Get suggestions from recent searches
    const recentSearches = await db('search_queries')
      .where('user_id', userId)
      .whereRaw('LOWER(query) LIKE ?', [searchTerm])
      .where('created_at', '>', db.raw('NOW() - INTERVAL \'30 days\''))
      .select('query', db.raw('COUNT(*) as frequency'))
      .groupBy('query')
      .orderBy('frequency', 'desc')
      .limit(5);

    // Get suggestions from index titles
    const titleSuggestions = await db('search_index')
      .where('is_deleted', false)
      .whereRaw('LOWER(title) LIKE ?', [searchTerm])
      .select('title')
      .distinct()
      .limit(5);

    return {
      recentSearches: recentSearches.map(s => s.query),
      titles: titleSuggestions.map(t => t.title)
    };
  }

  /**
   * Save search
   * @param {Object} data - Saved search data
   */
  static async saveSearch(data) {
    const [saved] = await db('saved_searches')
      .insert({
        user_id: data.userId,
        name: data.name,
        description: data.description,
        query: data.query,
        filters: JSON.stringify(data.filters || {}),
        sort_config: JSON.stringify(data.sortConfig || {}),
        scope: data.scope || 'personal',
        notify_on_new_results: data.notifyOnNewResults || false
      })
      .returning('*');

    return {
      ...saved,
      filters: saved.filters ? JSON.parse(saved.filters) : {},
      sortConfig: saved.sort_config ? JSON.parse(saved.sort_config) : {}
    };
  }

  /**
   * Get saved searches
   * @param {string} userId - User ID
   */
  static async getSavedSearches(userId) {
    const searches = await db('saved_searches')
      .where(function() {
        this.where('user_id', userId)
          .orWhere('scope', 'global')
          .orWhere('scope', 'shared');
      })
      .orderBy('created_at', 'desc');

    return searches.map(s => ({
      ...s,
      filters: s.filters ? JSON.parse(s.filters) : {},
      sortConfig: s.sort_config ? JSON.parse(s.sort_config) : {}
    }));
  }

  /**
   * Delete saved search
   * @param {string} id - Saved search ID
   * @param {string} userId - User ID (for validation)
   */
  static async deleteSavedSearch(id, userId) {
    await db('saved_searches')
      .where({ id, user_id: userId })
      .del();
  }

  /**
   * Record recent item access
   * @param {string} userId - User ID
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {string} action - Action type
   */
  static async recordRecentItem(userId, entityType, entityId, action = 'viewed') {
    // Use upsert to update existing or create new
    await db('recent_items')
      .insert({
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        action,
        accessed_at: new Date()
      })
      .onConflict(['user_id', 'entity_type', 'entity_id'])
      .merge({
        action,
        accessed_at: new Date()
      });
  }

  /**
   * Get recent items for user
   * @param {string} userId - User ID
   * @param {Object} filters - Filters
   */
  static async getRecentItems(userId, filters = {}) {
    const query = db('recent_items')
      .where('recent_items.user_id', userId)
      .orderBy('recent_items.accessed_at', 'desc');

    if (filters.entityTypes) {
      query.whereIn('recent_items.entity_type', filters.entityTypes);
    }

    const items = await query
      .leftJoin('contacts', function() {
        this.on('recent_items.entity_id', '=', 'contacts.id')
          .andOn('recent_items.entity_type', '=', db.raw('\'contact\''));
      })
      .leftJoin('companies', function() {
        this.on('recent_items.entity_id', '=', 'companies.id')
          .andOn('recent_items.entity_type', '=', db.raw('\'company\''));
      })
      .leftJoin('projects', function() {
        this.on('recent_items.entity_id', '=', 'projects.id')
          .andOn('recent_items.entity_type', '=', db.raw('\'project\''));
      })
      .leftJoin('bookings', function() {
        this.on('recent_items.entity_id', '=', 'bookings.id')
          .andOn('recent_items.entity_type', '=', db.raw('\'booking\''));
      })
      .select(
        'recent_items.*',
        'contacts.contact_name as contact_name',
        'companies.name as company_name',
        'projects.name as project_name',
        'bookings.booking_number'
      )
      .limit(filters.limit || 20);

    return items.map(item => ({
      ...item,
      entityName: item.contact_name || item.company_name || item.project_name || item.booking_number
    }));
  }

  /**
   * Rebuild search index
   * This is a maintenance function to rebuild the entire index
   */
  static async rebuildIndex() {
    // Clear existing index
    await db('search_index').del();

    // Index contacts
    const contacts = await db('contacts').select('*');
    for (const contact of contacts) {
      await this.indexEntity('contact', contact.id, {
        title: contact.contact_name || contact.email,
        content: [contact.email, contact.phone, contact.notes].filter(Boolean).join(' '),
        metadata: { company: contact.company_id },
        status: contact.status,
        entityDate: contact.created_at,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      });
    }

    // Index companies
    const companies = await db('companies').select('*');
    for (const company of companies) {
      await this.indexEntity('company', company.id, {
        title: company.name,
        content: [company.industry, company.notes, company.address].filter(Boolean).join(' '),
        metadata: { industry: company.industry },
        status: company.status,
        entityDate: company.created_at,
        createdAt: company.created_at,
        updatedAt: company.updated_at
      });
    }

    // Index bookings
    const bookings = await db('bookings').select('*');
    for (const booking of bookings) {
      await this.indexEntity('booking', booking.id, {
        title: `Booking ${booking.booking_number}`,
        content: [booking.notes, booking.shoot_location, booking.production_title].filter(Boolean).join(' '),
        metadata: { clientId: booking.client_id },
        status: booking.status,
        entityDate: booking.pickup_datetime,
        assignedTo: booking.assigned_to,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      });
    }

    // Index equipment
    const equipment = await db('equipment').select('*');
    for (const item of equipment) {
      await this.indexEntity('equipment', item.id, {
        title: item.name,
        content: [item.description, item.category, item.brand, item.model].filter(Boolean).join(' '),
        metadata: { category: item.category },
        status: item.status,
        category: item.category,
        entityDate: item.created_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      });
    }

    return { message: 'Search index rebuilt successfully' };
  }
}

module.exports = SearchModel;
