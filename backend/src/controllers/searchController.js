const logger = require('../utils/logger');

class SearchController {
  // Global search across all entities
  async globalSearch(req, res, next) {
    try {
      const { 
        q, 
        entity_types = 'all',
        limit = 10,
        page = 1
      } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: { message: 'Search query must be at least 2 characters' }
        });
      }

      const types = entity_types === 'all' 
        ? ['equipment', 'clients', 'bookings', 'projects', 'documents'] 
        : entity_types.split(',');

      const results = {};
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Search Equipment
      if (types.includes('equipment')) {
        const equipment = await knex('equipment')
          .select('*')
          .whereRaw(`
            setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(brand, '')), 'C') ||
            setweight(to_tsvector('english', COALESCE(model, '')), 'C')
            @@ plainto_tsquery('english', ?)
          `, [q])
          .orWhere('name', 'ilike', `%${q}%`)
          .orWhere('sku', 'ilike', `%${q}%`)
          .orWhere('serial_number', 'ilike', `%${q}%`)
          .limit(limit)
          .offset(offset);

        results.equipment = equipment;
      }

      // Search Clients
      if (types.includes('clients')) {
        const clients = await knex('clients')
          .select('*')
          .whereRaw(`
            setweight(to_tsvector('english', COALESCE(company_name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(contact_name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(email, '')), 'B')
            @@ plainto_tsquery('english', ?)
          `, [q])
          .orWhere('company_name', 'ilike', `%${q}%`)
          .orWhere('contact_name', 'ilike', `%${q}%`)
          .orWhere('email', 'ilike', `%${q}%`)
          .orWhere('phone', 'ilike', `%${q}%`)
          .limit(limit)
          .offset(offset);

        results.clients = clients;
      }

      // Search Projects
      if (types.includes('projects')) {
        const projects = await knex('projects')
          .select('projects.*', 'clients.company_name as client_name')
          .leftJoin('clients', 'projects.client_id', 'clients.id')
          .whereRaw(`
            setweight(to_tsvector('english', COALESCE(projects.name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(projects.description, '')), 'B')
            @@ plainto_tsquery('english', ?)
          `, [q])
          .orWhere('projects.name', 'ilike', `%${q}%`)
          .limit(limit)
          .offset(offset);

        results.projects = projects;
      }

      // Search Bookings
      if (types.includes('bookings')) {
        const bookings = await knex('bookings')
          .select('bookings.*', 'clients.company_name as client_name')
          .leftJoin('clients', 'bookings.client_id', 'clients.id')
          .where('bookings.id', 'ilike', `%${q}%`)
          .orWhere('clients.company_name', 'ilike', `%${q}%`)
          .orWhere('bookings.status', 'ilike', `%${q}%`)
          .limit(limit)
          .offset(offset);

        results.bookings = bookings;
      }

      // Search Documents
      if (types.includes('documents')) {
        const documents = await knex('documents')
          .select('*')
          .whereRaw(`search_vector @@ plainto_tsquery('english', ?)`, [q])
          .orWhere('name', 'ilike', `%${q}%`)
          .orWhere('original_name', 'ilike', `%${q}%`)
          .where('is_latest_version', true)
          .limit(limit)
          .offset(offset);

        results.documents = documents;
      }

      // Log search for suggestions
      await this.logSearch(q, req.user.id);

      res.json({
        success: true,
        data: results,
        meta: {
          query: q,
          entity_types: types,
          total_results: Object.values(results).flat().length
        }
      });
    } catch (error) {
      logger.error('Error performing global search:', error);
      next(error);
    }
  }

  // Advanced filtered search
  async advancedSearch(req, res, next) {
    try {
      const {
        entity_type,
        query,
        filters = {},
        sort_by = 'created_at',
        sort_order = 'desc',
        page = 1,
        limit = 20
      } = req.body;

      if (!entity_type) {
        return res.status(400).json({
          success: false,
          error: { message: 'Entity type is required' }
        });
      }

      let builder;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      switch (entity_type) {
        case 'equipment':
          builder = this.buildEquipmentQuery(filters, query);
          break;
        case 'bookings':
          builder = this.buildBookingQuery(filters, query);
          break;
        case 'clients':
          builder = this.buildClientQuery(filters, query);
          break;
        case 'projects':
          builder = this.buildProjectQuery(filters, query);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: { message: 'Invalid entity type' }
          });
      }

      // Apply sorting
      builder = builder.orderBy(sort_by, sort_order);

      // Apply pagination
      const results = await builder.limit(limit).offset(offset);
      
      // Get total count
      const countResult = await builder.clearSelect().clearOrder().count('* as count').first();
      const total = parseInt(countResult.count);

      res.json({
        success: true,
        data: results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error performing advanced search:', error);
      next(error);
    }
  }

  // Build equipment query with filters
  buildEquipmentQuery(filters, query) {
    let builder = knex('equipment').select('*');

    if (query) {
      builder = builder.where(builder => {
        builder.where('name', 'ilike', `%${query}%`)
          .orWhere('description', 'ilike', `%${query}%`)
          .orWhere('brand', 'ilike', `%${query}%`)
          .orWhere('sku', 'ilike', `%${query}%`);
      });
    }

    if (filters.category) {
      builder = builder.where('category', filters.category);
    }
    if (filters.subcategory) {
      builder = builder.where('subcategory', filters.subcategory);
    }
    if (filters.status) {
      builder = builder.where('status', filters.status);
    }
    if (filters.min_price) {
      builder = builder.where('daily_rate', '>=', filters.min_price);
    }
    if (filters.max_price) {
      builder = builder.where('daily_rate', '<=', filters.max_price);
    }
    if (filters.available === true) {
      builder = builder.where('quantity_available', '>', 0);
    }

    return builder;
  }

  // Build booking query with filters
  buildBookingQuery(filters, query) {
    let builder = knex('bookings')
      .select('bookings.*', 'clients.company_name as client_name')
      .leftJoin('clients', 'bookings.client_id', 'clients.id');

    if (query) {
      builder = builder.where(builder => {
        builder.where('bookings.id', 'ilike', `%${query}%`)
          .orWhere('clients.company_name', 'ilike', `%${query}%`);
      });
    }

    if (filters.status) {
      builder = builder.where('bookings.status', filters.status);
    }
    if (filters.date_from) {
      builder = builder.where('bookings.start_date', '>=', filters.date_from);
    }
    if (filters.date_to) {
      builder = builder.where('bookings.end_date', '<=', filters.date_to);
    }
    if (filters.client_id) {
      builder = builder.where('bookings.client_id', filters.client_id);
    }
    if (filters.project_id) {
      builder = builder.where('bookings.project_id', filters.project_id);
    }

    return builder;
  }

  // Build client query with filters
  buildClientQuery(filters, query) {
    let builder = knex('clients').select('*');

    if (query) {
      builder = builder.where(builder => {
        builder.where('company_name', 'ilike', `%${query}%`)
          .orWhere('contact_name', 'ilike', `%${query}%`)
          .orWhere('email', 'ilike', `%${query}%`);
      });
    }

    if (filters.tier) {
      builder = builder.where('tier', filters.tier);
    }
    if (filters.status) {
      builder = builder.where('status', filters.status);
    }
    if (filters.industry) {
      builder = builder.where('industry', filters.industry);
    }
    if (filters.has_active_bookings === true) {
      builder = builder.whereExists(function() {
        this.select('*')
          .from('bookings')
          .whereRaw('bookings.client_id = clients.id')
          .where('bookings.status', 'confirmed');
      });
    }

    return builder;
  }

  // Build project query with filters
  buildProjectQuery(filters, query) {
    let builder = knex('projects')
      .select('projects.*', 'clients.company_name as client_name')
      .leftJoin('clients', 'projects.client_id', 'clients.id');

    if (query) {
      builder = builder.where(builder => {
        builder.where('projects.name', 'ilike', `%${query}%`)
          .orWhere('projects.description', 'ilike', `%${query}%`);
      });
    }

    if (filters.status) {
      builder = builder.where('projects.status', filters.status);
    }
    if (filters.priority) {
      builder = builder.where('projects.priority', filters.priority);
    }
    if (filters.type) {
      builder = builder.where('projects.type', filters.type);
    }
    if (filters.project_manager_id) {
      builder = builder.where('projects.project_manager_id', filters.project_manager_id);
    }
    if (filters.date_from) {
      builder = builder.where('projects.start_date', '>=', filters.date_from);
    }
    if (filters.date_to) {
      builder = builder.where('projects.end_date', '<=', filters.date_to);
    }

    return builder;
  }

  // Save a search
  async saveSearch(req, res, next) {
    try {
      const { name, description, filters, entity_type, notify_frequency = 'never' } = req.body;

      const saved = await knex('saved_searches').insert({
        user_id: req.user.id,
        name,
        description,
        filters,
        entity_type,
        notify_frequency,
        is_active: true
      }).returning('*');

      res.status(201).json({
        success: true,
        data: saved[0]
      });
    } catch (error) {
      logger.error('Error saving search:', error);
      next(error);
    }
  }

  // Get saved searches
  async getSavedSearches(req, res, next) {
    try {
      const { entity_type } = req.query;

      let query = knex('saved_searches')
        .where('user_id', req.user.id)
        .where('is_active', true);

      if (entity_type) {
        query = query.where('entity_type', entity_type);
      }

      const searches = await query.orderBy('created_at', 'desc');

      res.json({
        success: true,
        data: searches
      });
    } catch (error) {
      logger.error('Error fetching saved searches:', error);
      next(error);
    }
  }

  // Delete saved search
  async deleteSavedSearch(req, res, next) {
    try {
      const { id } = req.params;

      await knex('saved_searches')
        .where({ id, user_id: req.user.id })
        .delete();

      res.json({
        success: true,
        message: 'Saved search deleted'
      });
    } catch (error) {
      logger.error('Error deleting saved search:', error);
      next(error);
    }
  }

  // Get search suggestions
  async getSuggestions(req, res, next) {
    try {
      const { q, entity_type } = req.query;

      if (!q || q.length < 2) {
        return res.json({ success: true, data: [] });
      }

      let query = knex('search_suggestions')
        .where('query', 'ilike', `%${q}%`)
        .orderBy('frequency', 'desc')
        .limit(10);

      if (entity_type) {
        query = query.where('entity_type', entity_type);
      }

      const suggestions = await query;

      res.json({
        success: true,
        data: suggestions.map(s => s.query)
      });
    } catch (error) {
      logger.error('Error fetching search suggestions:', error);
      next(error);
    }
  }

  // Log search for analytics
  async logSearch(query, userId) {
    try {
      // Update frequency if exists
      const existing = await knex('search_suggestions')
        .where({ query: query.toLowerCase() })
        .first();

      if (existing) {
        await knex('search_suggestions')
          .where('id', existing.id)
          .update({
            frequency: existing.frequency + 1,
            last_used: new Date().toISOString()
          });
      } else {
        await knex('search_suggestions').insert({
          query: query.toLowerCase(),
          frequency: 1
        });
      }
    } catch (error) {
      logger.error('Error logging search:', error);
    }
  }
}

module.exports = new SearchController();