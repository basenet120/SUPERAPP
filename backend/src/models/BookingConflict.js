const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');

/**
 * Booking Conflict Model
 * Track and manage booking conflicts for visualization
 */
class BookingConflictModel {
  /**
   * Detect and create conflicts for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Array>} Created conflicts
   */
  static async detectConflicts(bookingId) {
    // Get booking items
    const bookingItems = await db('booking_items')
      .where('booking_id', bookingId)
      .whereNotNull('equipment_id');

    if (bookingItems.length === 0) return [];

    const booking = await db('bookings').where('id', bookingId).first();
    if (!booking) return [];

    const conflicts = [];

    for (const item of bookingItems) {
      // Find overlapping bookings for this equipment
      const overlapping = await db('booking_items')
        .join('bookings', 'booking_items.booking_id', 'bookings.id')
        .where('booking_items.equipment_id', item.equipment_id)
        .where('bookings.id', '!=', bookingId)
        .whereIn('bookings.status', ['confirmed', 'draft', 'reserved'])
        .where(function() {
          this.whereBetween('bookings.pickup_datetime', [booking.pickup_datetime, booking.return_datetime])
            .orWhereBetween('bookings.return_datetime', [booking.pickup_datetime, booking.return_datetime])
            .orWhere(function() {
              this.where('bookings.pickup_datetime', '<=', booking.pickup_datetime)
                .where('bookings.return_datetime', '>=', booking.return_datetime);
            });
        })
        .select(
          'bookings.id as conflicting_booking_id',
          'bookings.pickup_datetime as conflict_start',
          'bookings.return_datetime as conflict_end',
          'bookings.booking_number'
        );

      for (const overlap of overlapping) {
        // Calculate conflict severity
        const conflictStart = new Date(Math.max(
          new Date(booking.pickup_datetime).getTime(),
          new Date(overlap.conflict_start).getTime()
        ));
        const conflictEnd = new Date(Math.min(
          new Date(booking.return_datetime).getTime(),
          new Date(overlap.conflict_end).getTime()
        ));

        const conflictHours = (conflictEnd - conflictStart) / (1000 * 60 * 60);
        const severity = conflictHours > 24 ? 'critical' : 'warning';

        // Check if conflict already exists
        const existing = await db('booking_conflicts')
          .where({
            booking_id: bookingId,
            conflicting_booking_id: overlap.conflicting_booking_id,
            equipment_id: item.equipment_id
          })
          .first();

        if (!existing) {
          const [conflict] = await db('booking_conflicts')
            .insert({
              booking_id: bookingId,
              conflicting_booking_id: overlap.conflicting_booking_id,
              equipment_id: item.equipment_id,
              conflict_start: conflictStart,
              conflict_end: conflictEnd,
              severity,
              status: 'open'
            })
            .returning('*');

          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }

  /**
   * Get conflicts for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Array>}
   */
  static async getForBooking(bookingId) {
    const conflicts = await db('booking_conflicts')
      .leftJoin('equipment', 'booking_conflicts.equipment_id', 'equipment.id')
      .leftJoin('bookings', 'booking_conflicts.conflicting_booking_id', 'bookings.id')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .where('booking_conflicts.booking_id', bookingId)
      .orderBy('booking_conflicts.severity', 'desc')
      .orderBy('booking_conflicts.conflict_start', 'asc')
      .select(
        'booking_conflicts.*',
        'equipment.name as equipment_name',
        'bookings.booking_number as conflicting_booking_number',
        'clients.contact_name as conflicting_client_name'
      );

    return conflicts.map(this.formatConflict);
  }

  /**
   * Get conflicts for equipment
   * @param {string} equipmentId - Equipment ID
   * @param {Date} startDate - Date range start
   * @param {Date} endDate - Date range end
   * @returns {Promise<Array>}
   */
  static async getForEquipment(equipmentId, startDate, endDate) {
    const query = db('booking_conflicts')
      .leftJoin('bookings as b1', 'booking_conflicts.booking_id', 'b1.id')
      .leftJoin('bookings as b2', 'booking_conflicts.conflicting_booking_id', 'b2.id')
      .leftJoin('clients as c1', 'b1.client_id', 'c1.id')
      .leftJoin('clients as c2', 'b2.client_id', 'c2.id')
      .where('booking_conflicts.equipment_id', equipmentId)
      .where('booking_conflicts.status', 'open');

    if (startDate && endDate) {
      query.where(function() {
        this.whereBetween('booking_conflicts.conflict_start', [startDate, endDate])
          .orWhereBetween('booking_conflicts.conflict_end', [startDate, endDate]);
      });
    }

    const conflicts = await query
      .orderBy('booking_conflicts.conflict_start', 'asc')
      .select(
        'booking_conflicts.*',
        'b1.booking_number as booking_number',
        'b2.booking_number as conflicting_booking_number',
        'c1.contact_name as client_name',
        'c2.contact_name as conflicting_client_name'
      );

    return conflicts.map(this.formatConflict);
  }

  /**
   * Get all conflicts
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>}
   */
  static async list(filters = {}) {
    const query = db('booking_conflicts')
      .leftJoin('equipment', 'booking_conflicts.equipment_id', 'equipment.id')
      .leftJoin('bookings as b1', 'booking_conflicts.booking_id', 'b1.id')
      .leftJoin('bookings as b2', 'booking_conflicts.conflicting_booking_id', 'b2.id')
      .orderBy('booking_conflicts.severity', 'desc')
      .orderBy('booking_conflicts.conflict_start', 'asc');

    if (filters.status) {
      query.where('booking_conflicts.status', filters.status);
    }

    if (filters.severity) {
      query.where('booking_conflicts.severity', filters.severity);
    }

    if (filters.equipmentId) {
      query.where('booking_conflicts.equipment_id', filters.equipmentId);
    }

    const conflicts = await query.select(
      'booking_conflicts.*',
      'equipment.name as equipment_name',
      'b1.booking_number as booking_number',
      'b2.booking_number as conflicting_booking_number'
    );

    return conflicts.map(this.formatConflict);
  }

  /**
   * Resolve a conflict
   * @param {string} conflictId - Conflict ID
   * @param {Object} data - Resolution data
   */
  static async resolve(conflictId, data) {
    const [conflict] = await db('booking_conflicts')
      .where({ id: conflictId })
      .update({
        status: 'resolved',
        resolution_notes: data.notes,
        resolved_by: data.resolvedBy,
        resolved_at: new Date()
      })
      .returning('*');

    if (!conflict) {
      throw new NotFoundError('Conflict');
    }

    return this.formatConflict(conflict);
  }

  /**
   * Ignore a conflict
   * @param {string} conflictId - Conflict ID
   * @param {string} userId - User ignoring
   * @param {string} reason - Reason for ignoring
   */
  static async ignore(conflictId, userId, reason) {
    const [conflict] = await db('booking_conflicts')
      .where({ id: conflictId })
      .update({
        status: 'ignored',
        resolution_notes: reason,
        resolved_by: userId,
        resolved_at: new Date()
      })
      .returning('*');

    if (!conflict) {
      throw new NotFoundError('Conflict');
    }

    return this.formatConflict(conflict);
  }

  /**
   * Get conflict statistics
   * @returns {Promise<Object>}
   */
  static async getStatistics() {
    const stats = await db('booking_conflicts')
      .select(
        'status',
        'severity',
        db.raw('COUNT(*) as count')
      )
      .groupBy('status', 'severity');

    const summary = {
      total: 0,
      open: 0,
      critical: 0,
      warning: 0
    };

    for (const row of stats) {
      summary.total += parseInt(row.count);
      
      if (row.status === 'open') {
        summary.open += parseInt(row.count);
        if (row.severity === 'critical') {
          summary.critical += parseInt(row.count);
        } else {
          summary.warning += parseInt(row.count);
        }
      }
    }

    return summary;
  }

  /**
   * Get availability timeline for visualization
   * @param {string} equipmentId - Equipment ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>}
   */
  static async getAvailabilityTimeline(equipmentId, startDate, endDate) {
    // Get all bookings for this equipment in date range
    const bookings = await db('booking_items')
      .join('bookings', 'booking_items.booking_id', 'bookings.id')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .where('booking_items.equipment_id', equipmentId)
      .whereIn('bookings.status', ['confirmed', 'draft', 'reserved'])
      .where(function() {
        this.whereBetween('bookings.pickup_datetime', [startDate, endDate])
          .orWhereBetween('bookings.return_datetime', [startDate, endDate])
          .orWhere(function() {
            this.where('bookings.pickup_datetime', '<=', startDate)
              .where('bookings.return_datetime', '>=', endDate);
          });
      })
      .orderBy('bookings.pickup_datetime', 'asc')
      .select(
        'bookings.id',
        'bookings.booking_number',
        'bookings.pickup_datetime',
        'bookings.return_datetime',
        'bookings.status',
        'clients.contact_name as client_name'
      );

    // Get conflicts for these bookings
    const conflicts = await db('booking_conflicts')
      .where('equipment_id', equipmentId)
      .where('status', 'open')
      .whereBetween('conflict_start', [startDate, endDate]);

    // Build timeline
    const timeline = bookings.map(booking => {
      const bookingConflicts = conflicts.filter(c => 
        c.booking_id === booking.id || c.conflicting_booking_id === booking.id
      );

      return {
        ...booking,
        hasConflict: bookingConflicts.length > 0,
        conflicts: bookingConflicts.map(c => ({
          id: c.id,
          severity: c.severity,
          start: c.conflict_start,
          end: c.conflict_end
        }))
      };
    });

    return timeline;
  }

  /**
   * Format conflict object
   * @param {Object} conflict - Raw conflict data
   * @returns {Object}
   */
  static formatConflict(conflict) {
    return {
      ...conflict,
      conflictStart: conflict.conflict_start,
      conflictEnd: conflict.conflict_end,
      resolvedAt: conflict.resolved_at,
      resolvedBy: conflict.resolved_by
    };
  }
}

module.exports = BookingConflictModel;
