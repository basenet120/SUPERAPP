const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');

/**
 * Booking Template Model
 * Save and reuse common booking configurations
 */
class BookingTemplateModel {
  /**
   * Create a new booking template
   * @param {Object} data - Template data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const [template] = await db('booking_templates')
      .insert({
        name: data.name,
        description: data.description,
        type: data.type || 'rental',
        created_by: data.createdBy,
        is_public: data.isPublic || false,
        status: 'active',
        default_items: JSON.stringify(data.defaultItems || []),
        default_dates: JSON.stringify(data.defaultDates || {}),
        default_locations: JSON.stringify(data.defaultLocations || {}),
        pricing_rules: JSON.stringify(data.pricingRules || {}),
        required_documents: JSON.stringify(data.requiredDocuments || []),
        checklist: JSON.stringify(data.checklist || [])
      })
      .returning('*');

    return this.findById(template.id);
  }

  /**
   * Find template by ID
   * @param {string} id - Template ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const template = await db('booking_templates')
      .leftJoin('users', 'booking_templates.created_by', 'users.id')
      .where('booking_templates.id', id)
      .select(
        'booking_templates.*',
        db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'System') as created_by_name")
      )
      .first();

    if (!template) return null;

    return this.formatTemplate(template);
  }

  /**
   * Update template
   * @param {string} id - Template ID
   * @param {Object} data - Update data
   */
  static async update(id, data) {
    const updateData = {};

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type) updateData.type = data.type;
    if (data.isPublic !== undefined) updateData.is_public = data.isPublic;
    if (data.status) updateData.status = data.status;
    if (data.defaultItems) updateData.default_items = JSON.stringify(data.defaultItems);
    if (data.defaultDates) updateData.default_dates = JSON.stringify(data.defaultDates);
    if (data.defaultLocations) updateData.default_locations = JSON.stringify(data.defaultLocations);
    if (data.pricingRules) updateData.pricing_rules = JSON.stringify(data.pricingRules);
    if (data.requiredDocuments) updateData.required_documents = JSON.stringify(data.requiredDocuments);
    if (data.checklist) updateData.checklist = JSON.stringify(data.checklist);

    const [template] = await db('booking_templates')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (!template) {
      throw new NotFoundError('Booking template');
    }

    return this.findById(id);
  }

  /**
   * Delete template (soft delete)
   * @param {string} id - Template ID
   */
  static async delete(id) {
    const result = await db('booking_templates')
      .where({ id })
      .update({ status: 'inactive' });

    if (result === 0) {
      throw new NotFoundError('Booking template');
    }
  }

  /**
   * List templates
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async list(filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = db('booking_templates')
      .leftJoin('users', 'booking_templates.created_by', 'users.id')
      .where('booking_templates.status', 'active')
      .orderBy('booking_templates.created_at', 'desc');

    // Filter by visibility
    if (filters.userId) {
      query.where(function() {
        this.where('booking_templates.is_public', true)
          .orWhere('booking_templates.created_by', filters.userId);
      });
    }

    if (filters.type) {
      query.where('booking_templates.type', filters.type);
    }

    if (filters.createdBy) {
      query.where('booking_templates.created_by', filters.createdBy);
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [countResult, rows] = await Promise.all([
      query.clone().count('* as count').first(),
      query
        .select(
          'booking_templates.*',
          db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'System') as created_by_name")
        )
        .limit(pagination.limit)
        .offset(offset)
    ]);

    return {
      data: rows.map(this.formatTemplate),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      }
    };
  }

  /**
   * Get templates by category/type
   * @param {string} type - Template type
   * @returns {Promise<Array>}
   */
  static async getByType(type) {
    const templates = await db('booking_templates')
      .where({ type, status: 'active' })
      .where('is_public', true)
      .orderBy('name');

    return templates.map(this.formatTemplate);
  }

  /**
   * Apply template to create booking data
   * @param {string} templateId - Template ID
   * @param {Object} overrides - Data to override
   * @returns {Promise<Object>}
   */
  static async applyTemplate(templateId, overrides = {}) {
    const template = await this.findById(templateId);
    if (!template) {
      throw new NotFoundError('Booking template');
    }

    // Calculate dates from template defaults
    let pickupDatetime = overrides.pickupDatetime;
    let returnDatetime = overrides.returnDatetime;

    if (!pickupDatetime && template.defaultDates?.duration_days) {
      const duration = template.defaultDates.duration_days;
      pickupDatetime = new Date();
      returnDatetime = new Date();
      returnDatetime.setDate(returnDatetime.getDate() + duration);
    }

    // Build booking data
    const bookingData = {
      type: template.type,
      pickupDatetime,
      returnDatetime,
      pickupLocation: overrides.pickupLocation || template.defaultLocations?.pickup,
      returnLocation: overrides.returnLocation || template.defaultLocations?.return,
      shootLocation: overrides.shootLocation || template.defaultLocations?.shoot,
      items: overrides.items || template.defaultItems || [],
      specialRequests: overrides.specialRequests,
      internalNotes: `Created from template: ${template.name}`,
      // Calculate pricing
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0
    };

    // Calculate totals from items
    if (bookingData.items.length > 0) {
      let subtotal = 0;
      for (const item of bookingData.items) {
        subtotal += (item.unitPrice || 0) * (item.quantity || 1) * (item.rentalDays || 1);
      }
      bookingData.subtotal = subtotal;
      
      // Apply pricing rules
      if (template.pricingRules?.taxRate) {
        bookingData.taxAmount = subtotal * (template.pricingRules.taxRate / 100);
      }
      if (template.pricingRules?.discountPercent) {
        bookingData.discountAmount = subtotal * (template.pricingRules.discountPercent / 100);
      }
      
      bookingData.totalAmount = subtotal + bookingData.taxAmount - bookingData.discountAmount;
    }

    return {
      template,
      bookingData
    };
  }

  /**
   * Clone a template
   * @param {string} templateId - Template ID to clone
   * @param {Object} newData - New template data (name, etc)
   * @param {string} userId - User creating the clone
   * @returns {Promise<Object>}
   */
  static async clone(templateId, newData, userId) {
    const original = await this.findById(templateId);
    if (!original) {
      throw new NotFoundError('Booking template');
    }

    return this.create({
      name: newData.name || `${original.name} (Copy)`,
      description: newData.description || original.description,
      type: original.type,
      createdBy: userId,
      isPublic: newData.isPublic !== undefined ? newData.isPublic : original.isPublic,
      defaultItems: original.defaultItems,
      defaultDates: original.defaultDates,
      defaultLocations: original.defaultLocations,
      pricingRules: original.pricingRules,
      requiredDocuments: original.requiredDocuments,
      checklist: original.checklist
    });
  }

  /**
   * Get popular templates (most used)
   * @param {number} limit - Number to return
   * @returns {Promise<Array>}
   */
  static async getPopular(limit = 5) {
    // This would track usage in a real implementation
    // For now, return most recently used public templates
    const templates = await db('booking_templates')
      .where({ status: 'active', is_public: true })
      .orderBy('updated_at', 'desc')
      .limit(limit);

    return templates.map(this.formatTemplate);
  }

  /**
   * Format template object
   * @param {Object} template - Raw template data
   * @returns {Object} Formatted template
   */
  static formatTemplate(template) {
    return {
      ...template,
      defaultItems: template.default_items ? JSON.parse(template.default_items) : [],
      defaultDates: template.default_dates ? JSON.parse(template.default_dates) : {},
      defaultLocations: template.default_locations ? JSON.parse(template.default_locations) : {},
      pricingRules: template.pricing_rules ? JSON.parse(template.pricing_rules) : {},
      requiredDocuments: template.required_documents ? JSON.parse(template.required_documents) : [],
      checklist: template.checklist ? JSON.parse(template.checklist) : []
    };
  }
}

module.exports = BookingTemplateModel;
