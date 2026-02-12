const db = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/errors');

class EquipmentModel {
  /**
   * Find equipment by ID
   * @param {string} id - Equipment ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const equipment = await db('equipment')
      .leftJoin('equipment_categories', 'equipment.category_id', 'equipment_categories.id')
      .leftJoin('vendors', 'equipment.vendor_id', 'vendors.id')
      .where('equipment.id', id)
      .whereNull('equipment.deleted_at')
      .select(
        'equipment.*',
        'equipment_categories.name as category_name',
        'vendors.name as vendor_name',
        'vendors.type as vendor_type',
        'vendors.markup_percentage as vendor_markup'
      )
      .first();

    if (!equipment) return null;
    
    return this.formatEquipment(equipment);
  }

  /**
   * Create new equipment
   * @param {Object} data - Equipment data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    // Check SKU uniqueness
    if (data.sku) {
      const existing = await db('equipment').where({ sku: data.sku }).first();
      if (existing) {
        throw new ConflictError('SKU already exists');
      }
    }

    const [equipment] = await db('equipment')
      .insert({
        name: data.name,
        sku: data.sku,
        description: data.description,
        category_id: data.categoryId,
        vendor_id: data.vendorId,
        ownership_type: data.ownershipType || 'owned',
        status: data.status || 'available',
        condition: data.condition || 'good',
        daily_rate: data.dailyRate,
        weekly_rate: data.weeklyRate,
        monthly_rate: data.monthlyRate,
        purchase_price: data.purchasePrice,
        purchase_date: data.purchaseDate,
        serial_number: data.serialNumber,
        location: data.location,
        specifications: data.specifications ? JSON.stringify(data.specifications) : '{}',
        images: data.images ? JSON.stringify(data.images) : '[]'
      })
      .returning('*');

    return this.findById(equipment.id);
  }

  /**
   * Update equipment
   * @param {string} id - Equipment ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  static async update(id, data) {
    const updateData = {};

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId) updateData.category_id = data.categoryId;
    if (data.vendorId) updateData.vendor_id = data.vendorId;
    if (data.status) updateData.status = data.status;
    if (data.condition) updateData.condition = data.condition;
    if (data.dailyRate !== undefined) updateData.daily_rate = data.dailyRate;
    if (data.weeklyRate !== undefined) updateData.weekly_rate = data.weeklyRate;
    if (data.monthlyRate !== undefined) updateData.monthly_rate = data.monthlyRate;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.specifications) updateData.specifications = JSON.stringify(data.specifications);
    if (data.images) updateData.images = JSON.stringify(data.images);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [equipment] = await db('equipment')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (!equipment) {
      throw new NotFoundError('Equipment');
    }

    return this.findById(id);
  }

  /**
   * Delete equipment (soft delete)
   * @param {string} id - Equipment ID
   */
  static async delete(id) {
    const result = await db('equipment')
      .where({ id })
      .update({ deleted_at: new Date() });

    if (result === 0) {
      throw new NotFoundError('Equipment');
    }
  }

  /**
   * List equipment with filters
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async list(filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = db('equipment')
      .leftJoin('equipment_categories', 'equipment.category_id', 'equipment_categories.id')
      .leftJoin('vendors', 'equipment.vendor_id', 'vendors.id')
      .whereNull('equipment.deleted_at')
      .orderBy('equipment.created_at', 'desc');

    if (filters.categoryId) {
      query.where('equipment.category_id', filters.categoryId);
    }

    if (filters.vendorId) {
      query.where('equipment.vendor_id', filters.vendorId);
    }

    if (filters.status) {
      query.where('equipment.status', filters.status);
    }

    if (filters.ownershipType) {
      query.where('equipment.ownership_type', filters.ownershipType);
    }

    if (filters.search) {
      query.where(builder => {
        builder
          .where('equipment.name', 'ilike', `%${filters.search}%`)
          .orWhere('equipment.sku', 'ilike', `%${filters.search}%`)
          .orWhere('equipment.description', 'ilike', `%${filters.search}%`);
      });
    }

    const offset = (pagination.page - 1) * pagination.limit;
    
    const [countResult, rows] = await Promise.all([
      query.clone().count('* as count').first(),
      query
        .select(
          'equipment.*',
          'equipment_categories.name as category_name',
          'vendors.name as vendor_name'
        )
        .limit(pagination.limit)
        .offset(offset)
    ]);

    return {
      data: rows.map(this.formatEquipment),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      }
    };
  }

  /**
   * Check equipment availability for date range
   * @param {string} equipmentId - Equipment ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} excludeBookingId - Booking ID to exclude from check
   * @returns {Promise<boolean>}
   */
  static async checkAvailability(equipmentId, startDate, endDate, excludeBookingId = null) {
    const query = db('booking_items')
      .join('bookings', 'booking_items.booking_id', 'bookings.id')
      .where('booking_items.equipment_id', equipmentId)
      .whereIn('booking_items.status', ['reserved', 'picked_up'])
      .where('bookings.status', 'not in', ['cancelled', 'completed', 'refunded'])
      .where(function() {
        this.whereBetween('bookings.pickup_datetime', [startDate, endDate])
          .orWhereBetween('bookings.return_datetime', [startDate, endDate])
          .orWhere(function() {
            this.where('bookings.pickup_datetime', '<=', startDate)
              .where('bookings.return_datetime', '>=', endDate);
          });
      });

    if (excludeBookingId) {
      query.where('bookings.id', '!=', excludeBookingId);
    }

    const conflicts = await query.count('* as count').first();
    return parseInt(conflicts.count, 10) === 0;
  }

  /**
   * Get equipment availability calendar
   * @param {string} equipmentId - Equipment ID
   * @param {Date} startDate - Start of range
   * @param {Date} endDate - End of range
   * @returns {Promise<Array>}
   */
  static async getAvailabilityCalendar(equipmentId, startDate, endDate) {
    const bookings = await db('booking_items')
      .join('bookings', 'booking_items.booking_id', 'bookings.id')
      .where('booking_items.equipment_id', equipmentId)
      .whereIn('booking_items.status', ['reserved', 'picked_up'])
      .where('bookings.status', 'not in', ['cancelled', 'completed', 'refunded'])
      .where(function() {
        this.whereBetween('bookings.pickup_datetime', [startDate, endDate])
          .orWhereBetween('bookings.return_datetime', [startDate, endDate])
          .orWhere(function() {
            this.where('bookings.pickup_datetime', '<=', startDate)
              .where('bookings.return_datetime', '>=', endDate);
          });
      })
      .select(
        'bookings.id as booking_id',
        'bookings.pickup_datetime',
        'bookings.return_datetime',
        'bookings.status as booking_status',
        'booking_items.status as item_status'
      );

    return bookings;
  }

  /**
   * Calculate pricing with markup for partner equipment
   * @param {Object} equipment - Equipment object
   * @param {number} days - Number of rental days
   * @returns {Object} Pricing breakdown
   */
  static calculatePricing(equipment, days) {
    let baseRate = equipment.daily_rate;
    
    // Apply weekly/monthly discounts
    if (days >= 30 && equipment.monthly_rate) {
      baseRate = equipment.monthly_rate / 30;
    } else if (days >= 7 && equipment.weekly_rate) {
      baseRate = equipment.weekly_rate / 7;
    }

    let subtotal = baseRate * days;
    let markupAmount = 0;

    // Apply partner markup
    if (equipment.vendor_type === 'partner' && equipment.vendor_markup > 0) {
      markupAmount = subtotal * (equipment.vendor_markup / 100);
    }

    const total = subtotal + markupAmount;

    return {
      dailyRate: baseRate,
      days,
      subtotal: parseFloat(subtotal.toFixed(2)),
      markupPercentage: equipment.vendor_markup || 0,
      markupAmount: parseFloat(markupAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }

  /**
   * Format equipment object
   * @param {Object} equipment - Raw equipment data
   * @returns {Object} Formatted equipment
   */
  static formatEquipment(equipment) {
    return {
      ...equipment,
      specifications: equipment.specifications ? JSON.parse(equipment.specifications) : {},
      images: equipment.images ? JSON.parse(equipment.images) : []
    };
  }
}

module.exports = EquipmentModel;
