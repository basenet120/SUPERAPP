const db = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * Recurring Booking Model
 * Handles recurring booking patterns and instance generation
 */
class RecurringBookingModel {
  /**
   * Create a new recurring booking pattern
   * @param {Object} data - Recurring booking data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    // Validate date range
    if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      throw new ValidationError('End date must be after start date');
    }

    const [recurring] = await db('recurring_bookings')
      .insert({
        parent_booking_id: data.parentBookingId,
        frequency: data.frequency,
        interval: data.interval || 1,
        days_of_week: data.daysOfWeek ? JSON.stringify(data.daysOfWeek) : '[]',
        day_of_month: data.dayOfMonth,
        start_date: data.startDate,
        end_date: data.endDate,
        occurrences: data.occurrences,
        status: 'active'
      })
      .returning('*');

    // Generate child bookings
    if (data.generateInstances !== false) {
      await this.generateInstances(recurring.id);
    }

    return this.findById(recurring.id);
  }

  /**
   * Find recurring booking by ID
   * @param {string} id - Recurring booking ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const recurring = await db('recurring_bookings')
      .leftJoin('bookings', 'recurring_bookings.parent_booking_id', 'bookings.id')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .where('recurring_bookings.id', id)
      .select(
        'recurring_bookings.*',
        'bookings.booking_number as parent_booking_number',
        'clients.contact_name as client_name'
      )
      .first();

    if (!recurring) return null;

    return this.formatRecurring(recurring);
  }

  /**
   * Get instances of a recurring booking
   * @param {string} recurringId - Recurring booking ID
   * @returns {Promise<Array>}
   */
  static async getInstances(recurringId) {
    return db('bookings')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .where('bookings.recurring_booking_id', recurringId)
      .whereNull('bookings.deleted_at')
      .orderBy('bookings.pickup_datetime', 'asc')
      .select(
        'bookings.*',
        'clients.contact_name as client_name'
      );
  }

  /**
   * Generate booking instances from pattern
   * @param {string} recurringId - Recurring booking ID
   */
  static async generateInstances(recurringId) {
    const recurring = await this.findById(recurringId);
    if (!recurring) {
      throw new NotFoundError('Recurring booking');
    }

    const parentBooking = await db('bookings')
      .where('id', recurring.parent_booking_id)
      .first();

    if (!parentBooking) {
      throw new NotFoundError('Parent booking');
    }

    const instances = this.calculateDates(recurring);
    const createdBookings = [];

    for (const dateRange of instances) {
      try {
        // Check for conflicts
        const hasConflicts = await this.checkConflicts(
          recurring.parent_booking_id,
          dateRange.start,
          dateRange.end
        );

        // Create child booking
        const bookingNumber = await this.generateBookingNumber();
        const [booking] = await db('bookings')
          .insert({
            booking_number: bookingNumber,
            recurring_booking_id: recurringId,
            parent_booking_id: recurring.parent_booking_id,
            client_id: parentBooking.client_id,
            project_id: parentBooking.project_id,
            created_by: parentBooking.created_by,
            type: parentBooking.type,
            status: hasConflicts ? 'draft' : 'confirmed',
            pickup_datetime: dateRange.start,
            return_datetime: dateRange.end,
            pickup_location: parentBooking.pickup_location,
            return_location: parentBooking.return_location,
            shoot_location: parentBooking.shoot_location,
            description: parentBooking.description,
            subtotal: parentBooking.subtotal,
            tax_amount: parentBooking.tax_amount,
            discount_amount: parentBooking.discount_amount,
            total_amount: parentBooking.total_amount,
            deposit_amount: parentBooking.deposit_amount,
            balance_due: parentBooking.balance_due,
            special_requests: parentBooking.special_requests,
            internal_notes: `Recurring booking instance from ${recurring.frequency} pattern`
          })
          .returning('*');

        // Copy booking items
        const parentItems = await db('booking_items')
          .where('booking_id', recurring.parent_booking_id);

        if (parentItems.length > 0) {
          const newItems = parentItems.map(item => ({
            booking_id: booking.id,
            equipment_id: item.equipment_id,
            kit_id: item.kit_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            rental_days: item.rental_days,
            notes: item.notes
          }));

          await db('booking_items').insert(newItems);
        }

        createdBookings.push(booking);

      } catch (error) {
        console.error('Error creating recurring instance:', error);
      }
    }

    return createdBookings;
  }

  /**
   * Calculate date instances from recurring pattern
   * @param {Object} recurring - Recurring booking data
   * @returns {Array}
   */
  static calculateDates(recurring) {
    const instances = [];
    const startDate = new Date(recurring.start_date);
    const endDate = recurring.end_date ? new Date(recurring.end_date) : null;
    const maxOccurrences = recurring.occurrences || 52; // Default max 1 year weekly
    
    let currentDate = new Date(startDate);
    let occurrenceCount = 0;

    const parentBooking = { pickup_datetime: startDate, return_datetime: startDate };
    const durationMs = parentBooking.return_datetime - parentBooking.pickup_datetime;

    while (occurrenceCount < maxOccurrences) {
      if (endDate && currentDate > endDate) break;

      let shouldAdd = false;

      switch (recurring.frequency) {
        case 'daily':
          shouldAdd = true;
          currentDate.setDate(currentDate.getDate() + (recurring.interval || 1));
          break;

        case 'weekly':
          if (recurring.days_of_week && recurring.days_of_week.length > 0) {
            // Multiple days per week
            for (const dayOfWeek of recurring.days_of_week.sort((a, b) => a - b)) {
              const date = new Date(currentDate);
              const currentDay = date.getDay();
              const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
              date.setDate(date.getDate() + daysToAdd);
              
              if ((!endDate || date <= endDate) && date >= startDate) {
                const endDatetime = new Date(date.getTime() + durationMs);
                instances.push({ start: date, end: endDatetime });
                occurrenceCount++;
              }
            }
            currentDate.setDate(currentDate.getDate() + (7 * (recurring.interval || 1)));
            continue; // Skip default add
          } else {
            shouldAdd = true;
            currentDate.setDate(currentDate.getDate() + (7 * (recurring.interval || 1)));
          }
          break;

        case 'biweekly':
          shouldAdd = true;
          currentDate.setDate(currentDate.getDate() + (14 * (recurring.interval || 1)));
          break;

        case 'monthly':
          shouldAdd = true;
          if (recurring.day_of_month) {
            currentDate.setDate(recurring.day_of_month);
          }
          currentDate.setMonth(currentDate.getMonth() + (recurring.interval || 1));
          break;

        case 'custom':
          // Custom logic - implement as needed
          shouldAdd = true;
          break;
      }

      if (shouldAdd && (!endDate || currentDate <= endDate)) {
        const endDatetime = new Date(currentDate.getTime() + durationMs);
        instances.push({ start: new Date(currentDate), end: endDatetime });
        occurrenceCount++;
      }
    }

    return instances;
  }

  /**
   * Check for conflicts
   * @param {string} parentBookingId - Parent booking ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<boolean>}
   */
  static async checkConflicts(parentBookingId, startDate, endDate) {
    const parentItems = await db('booking_items')
      .where('booking_id', parentBookingId)
      .select('equipment_id');

    for (const item of parentItems) {
      if (!item.equipment_id) continue;

      const EquipmentModel = require('./Equipment');
      const isAvailable = await EquipmentModel.checkAvailability(
        item.equipment_id,
        startDate,
        endDate
      );

      if (!isAvailable) {
        return true; // Has conflicts
      }
    }

    return false;
  }

  /**
   * Update recurring booking
   * @param {string} id - Recurring booking ID
   * @param {Object} data - Update data
   */
  static async update(id, data) {
    const updateData = {};

    if (data.frequency) updateData.frequency = data.frequency;
    if (data.interval !== undefined) updateData.interval = data.interval;
    if (data.daysOfWeek) updateData.days_of_week = JSON.stringify(data.daysOfWeek);
    if (data.dayOfMonth !== undefined) updateData.day_of_month = data.dayOfMonth;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.occurrences !== undefined) updateData.occurrences = data.occurrences;
    if (data.status) updateData.status = data.status;

    const [recurring] = await db('recurring_bookings')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (!recurring) {
      throw new NotFoundError('Recurring booking');
    }

    return this.findById(id);
  }

  /**
   * Cancel recurring booking and all future instances
   * @param {string} id - Recurring booking ID
   * @param {string} userId - User cancelling
   */
  static async cancel(id, userId) {
    await db.transaction(async (trx) => {
      // Update recurring pattern
      await trx('recurring_bookings')
        .where({ id })
        .update({ status: 'cancelled' });

      // Cancel future bookings
      await trx('bookings')
        .where('recurring_booking_id', id)
        .where('pickup_datetime', '>', new Date())
        .whereNotIn('status', ['completed', 'cancelled'])
        .update({
          status: 'cancelled',
          updated_at: new Date()
        });
    });
  }

  /**
   * List recurring bookings
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async list(filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = db('recurring_bookings')
      .leftJoin('bookings', 'recurring_bookings.parent_booking_id', 'bookings.id')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .orderBy('recurring_bookings.created_at', 'desc');

    if (filters.status) {
      query.where('recurring_bookings.status', filters.status);
    }

    if (filters.clientId) {
      query.where('bookings.client_id', filters.clientId);
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [countResult, rows] = await Promise.all([
      query.clone().count('* as count').first(),
      query
        .select(
          'recurring_bookings.*',
          'bookings.booking_number as parent_booking_number',
          'clients.contact_name as client_name'
        )
        .limit(pagination.limit)
        .offset(offset)
    ]);

    return {
      data: rows.map(this.formatRecurring),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      }
    };
  }

  /**
   * Generate unique booking number
   * @returns {Promise<string>}
   */
  static async generateBookingNumber() {
    const date = new Date();
    const prefix = 'BK';
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const count = await db('bookings')
      .whereRaw("EXTRACT(YEAR FROM created_at) = ?", [date.getFullYear()])
      .whereRaw("EXTRACT(MONTH FROM created_at) = ?", [date.getMonth() + 1])
      .count('* as count')
      .first();
    
    const sequence = String(parseInt(count.count) + 1).padStart(4, '0');
    return `${prefix}${year}${month}${sequence}-R`;
  }

  /**
   * Format recurring booking object
   * @param {Object} recurring - Raw recurring data
   * @returns {Object} Formatted recurring
   */
  static formatRecurring(recurring) {
    return {
      ...recurring,
      daysOfWeek: recurring.days_of_week ? JSON.parse(recurring.days_of_week) : [],
    };
  }
}

module.exports = RecurringBookingModel;
