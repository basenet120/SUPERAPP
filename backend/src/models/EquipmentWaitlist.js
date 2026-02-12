const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');

/**
 * Equipment Waitlist Model
 * Track waitlist requests for unavailable equipment
 */
class EquipmentWaitlistModel {
  /**
   * Add item to waitlist
   * @param {Object} data - Waitlist entry data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    // Check if already on waitlist for same dates
    const existing = await db('equipment_waitlist')
      .where({
        equipment_id: data.equipmentId,
        client_id: data.clientId,
        status: 'pending'
      })
      .where(function() {
        this.whereBetween('requested_start_date', [data.requestedStartDate, data.requestedEndDate])
          .orWhereBetween('requested_end_date', [data.requestedStartDate, data.requestedEndDate]);
      })
      .first();

    if (existing) {
      // Update existing entry
      const [updated] = await db('equipment_waitlist')
        .where({ id: existing.id })
        .update({
          quantity: data.quantity || existing.quantity,
          priority: data.priority || existing.priority,
          notes: data.notes || existing.notes,
          updated_at: new Date()
        })
        .returning('*');

      return this.formatWaitlist(updated);
    }

    const [waitlist] = await db('equipment_waitlist')
      .insert({
        equipment_id: data.equipmentId,
        client_id: data.clientId,
        requested_start_date: data.requestedStartDate,
        requested_end_date: data.requestedEndDate,
        quantity: data.quantity || 1,
        priority: data.priority || 'normal',
        notes: data.notes,
        status: 'pending'
      })
      .returning('*');

    return this.findById(waitlist.id);
  }

  /**
   * Find waitlist entry by ID
   * @param {string} id - Waitlist entry ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const waitlist = await db('equipment_waitlist')
      .leftJoin('equipment', 'equipment_waitlist.equipment_id', 'equipment.id')
      .leftJoin('clients', 'equipment_waitlist.client_id', 'clients.id')
      .where('equipment_waitlist.id', id)
      .select(
        'equipment_waitlist.*',
        'equipment.name as equipment_name',
        'equipment.sku as equipment_sku',
        'clients.contact_name as client_name',
        'clients.email as client_email',
        'clients.phone as client_phone'
      )
      .first();

    if (!waitlist) return null;

    return this.formatWaitlist(waitlist);
  }

  /**
   * Get waitlist for equipment
   * @param {string} equipmentId - Equipment ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>}
   */
  static async getForEquipment(equipmentId, filters = {}) {
    const query = db('equipment_waitlist')
      .leftJoin('clients', 'equipment_waitlist.client_id', 'clients.id')
      .where('equipment_waitlist.equipment_id', equipmentId)
      .orderBy('equipment_waitlist.priority', 'desc')
      .orderBy('equipment_waitlist.created_at', 'asc');

    if (filters.status) {
      query.where('equipment_waitlist.status', filters.status);
    }

    if (filters.startDate) {
      query.where('equipment_waitlist.requested_start_date', '>=', filters.startDate);
    }

    if (filters.endDate) {
      query.where('equipment_waitlist.requested_end_date', '<=', filters.endDate);
    }

    const rows = await query.select(
      'equipment_waitlist.*',
      'clients.contact_name as client_name',
      'clients.email as client_email',
      'clients.phone as client_phone'
    );

    return rows.map(this.formatWaitlist);
  }

  /**
   * Get waitlist for client
   * @param {string} clientId - Client ID
   * @returns {Promise<Array>}
   */
  static async getForClient(clientId) {
    const rows = await db('equipment_waitlist')
      .leftJoin('equipment', 'equipment_waitlist.equipment_id', 'equipment.id')
      .where('equipment_waitlist.client_id', clientId)
      .orderBy('equipment_waitlist.created_at', 'desc')
      .select(
        'equipment_waitlist.*',
        'equipment.name as equipment_name',
        'equipment.sku as equipment_sku',
        'equipment.images as equipment_images'
      );

    return rows.map(row => ({
      ...this.formatWaitlist(row),
      equipmentImages: row.equipment_images ? JSON.parse(row.equipment_images) : []
    }));
  }

  /**
   * Check and notify waitlist when equipment becomes available
   * @param {string} equipmentId - Equipment ID
   * @param {Date} startDate - Availability start
   * @param {Date} endDate - Availability end
   * @returns {Promise<Array>} Notified entries
   */
  static async checkAndNotify(equipmentId, startDate, endDate) {
    // Find waitlist entries that could be satisfied
    const waitlistEntries = await db('equipment_waitlist')
      .leftJoin('clients', 'equipment_waitlist.client_id', 'clients.id')
      .where({
        'equipment_waitlist.equipment_id': equipmentId,
        'equipment_waitlist.status': 'pending'
      })
      .where('equipment_waitlist.requested_start_date', '>=', startDate)
      .where('equipment_waitlist.requested_end_date', '<=', endDate)
      .orderBy('equipment_waitlist.priority', 'desc')
      .orderBy('equipment_waitlist.created_at', 'asc')
      .select(
        'equipment_waitlist.*',
        'clients.contact_name as client_name',
        'clients.email as client_email',
        'clients.phone as client_phone'
      );

    const notified = [];

    for (const entry of waitlistEntries) {
      // Mark as notified
      await db('equipment_waitlist')
        .where({ id: entry.id })
        .update({
          status: 'notified',
          notified_at: new Date()
        });

      notified.push(this.formatWaitlist(entry));

      // TODO: Send notification to client
      // await notificationService.sendWaitlistNotification(entry);
    }

    return notified;
  }

  /**
   * Convert waitlist entry to booking
   * @param {string} waitlistId - Waitlist entry ID
   * @param {string} bookingId - New booking ID
   */
  static async convertToBooking(waitlistId, bookingId) {
    const [updated] = await db('equipment_waitlist')
      .where({ id: waitlistId })
      .update({
        status: 'converted',
        converted_booking_id: bookingId,
        updated_at: new Date()
      })
      .returning('*');

    if (!updated) {
      throw new NotFoundError('Waitlist entry');
    }

    return this.findById(waitlistId);
  }

  /**
   * Update waitlist entry
   * @param {string} id - Waitlist entry ID
   * @param {Object} data - Update data
   */
  static async update(id, data) {
    const updateData = {};

    if (data.priority) updateData.priority = data.priority;
    if (data.quantity) updateData.quantity = data.quantity;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status) updateData.status = data.status;

    const [waitlist] = await db('equipment_waitlist')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (!waitlist) {
      throw new NotFoundError('Waitlist entry');
    }

    return this.findById(id);
  }

  /**
   * Remove from waitlist
   * @param {string} id - Waitlist entry ID
   * @param {string} reason - Cancellation reason
   */
  static async cancel(id, reason = null) {
    const [waitlist] = await db('equipment_waitlist')
      .where({ id })
      .update({
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : undefined,
        updated_at: new Date()
      })
      .returning('*');

    if (!waitlist) {
      throw new NotFoundError('Waitlist entry');
    }
  }

  /**
   * List all waitlist entries
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async list(filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = db('equipment_waitlist')
      .leftJoin('equipment', 'equipment_waitlist.equipment_id', 'equipment.id')
      .leftJoin('clients', 'equipment_waitlist.client_id', 'clients.id')
      .orderBy('equipment_waitlist.priority', 'desc')
      .orderBy('equipment_waitlist.created_at', 'asc');

    if (filters.status) {
      query.where('equipment_waitlist.status', filters.status);
    }

    if (filters.equipmentId) {
      query.where('equipment_waitlist.equipment_id', filters.equipmentId);
    }

    if (filters.clientId) {
      query.where('equipment_waitlist.client_id', filters.clientId);
    }

    if (filters.priority) {
      query.where('equipment_waitlist.priority', filters.priority);
    }

    if (filters.dateFrom) {
      query.where('equipment_waitlist.requested_start_date', '>=', filters.dateFrom);
    }

    if (filters.dateTo) {
      query.where('equipment_waitlist.requested_end_date', '<=', filters.dateTo);
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [countResult, rows] = await Promise.all([
      query.clone().count('* as count').first(),
      query
        .select(
          'equipment_waitlist.*',
          'equipment.name as equipment_name',
          'equipment.sku as equipment_sku',
          'clients.contact_name as client_name',
          'clients.email as client_email'
        )
        .limit(pagination.limit)
        .offset(offset)
    ]);

    return {
      data: rows.map(this.formatWaitlist),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      }
    };
  }

  /**
   * Get waitlist statistics
   * @returns {Promise<Object>}
   */
  static async getStatistics() {
    const stats = await db('equipment_waitlist')
      .select(
        'status',
        'priority',
        db.raw('COUNT(*) as count')
      )
      .groupBy('status', 'priority');

    const summary = {
      total: 0,
      byStatus: {},
      byPriority: {},
      highPriority: 0
    };

    for (const row of stats) {
      summary.total += parseInt(row.count);
      
      summary.byStatus[row.status] = (summary.byStatus[row.status] || 0) + parseInt(row.count);
      summary.byPriority[row.priority] = (summary.byPriority[row.priority] || 0) + parseInt(row.count);
      
      if (['high', 'urgent'].includes(row.priority)) {
        summary.highPriority += parseInt(row.count);
      }
    }

    return summary;
  }

  /**
   * Expire old waitlist entries
   * @param {number} days - Days after requested date to expire
   */
  static async expireOldEntries(days = 1) {
    const expired = await db('equipment_waitlist')
      .where('status', 'pending')
      .where('requested_end_date', '<', db.raw(`NOW() - INTERVAL '${days} days'`))
      .update({
        status: 'expired',
        updated_at: new Date()
      });

    return expired;
  }

  /**
   * Format waitlist entry
   * @param {Object} entry - Raw waitlist data
   * @returns {Object}
   */
  static formatWaitlist(entry) {
    return {
      ...entry,
      requestedStartDate: entry.requested_start_date,
      requestedEndDate: entry.requested_end_date,
      equipmentId: entry.equipment_id,
      clientId: entry.client_id,
      convertedBookingId: entry.converted_booking_id,
      notifiedAt: entry.notified_at
    };
  }
}

module.exports = EquipmentWaitlistModel;
