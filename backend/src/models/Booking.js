const db = require('../config/database');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');

class BookingModel {
  /**
   * Find booking by ID
   * @param {string} id - Booking ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const booking = await db('bookings')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .leftJoin('projects', 'bookings.project_id', 'projects.id')
      .where('bookings.id', id)
      .whereNull('bookings.deleted_at')
      .select(
        'bookings.*',
        'clients.company_name as client_company',
        'clients.contact_name as client_name',
        'clients.email as client_email',
        'clients.phone as client_phone',
        'projects.name as project_name'
      )
      .first();

    if (!booking) return null;

    // Get booking items
    const items = await this.getItems(id);

    return { ...booking, items };
  }

  /**
   * Find booking by booking number
   * @param {string} bookingNumber - Booking number
   * @returns {Promise<Object|null>}
   */
  static async findByNumber(bookingNumber) {
    const booking = await db('bookings')
      .where({ booking_number: bookingNumber })
      .whereNull('deleted_at')
      .first();

    if (!booking) return null;

    return this.findById(booking.id);
  }

  /**
   * Create new booking
   * @param {Object} data - Booking data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const bookingNumber = await this.generateBookingNumber();

    const [booking] = await db('bookings')
      .insert({
        booking_number: bookingNumber,
        client_id: data.clientId,
        project_id: data.projectId,
        created_by: data.createdBy,
        type: data.type || 'rental',
        status: data.status || 'draft',
        pickup_datetime: data.pickupDatetime,
        return_datetime: data.returnDatetime,
        pickup_location: data.pickupLocation,
        return_location: data.returnLocation,
        shoot_location: data.shootLocation,
        description: data.description,
        subtotal: data.subtotal || 0,
        tax_amount: data.taxAmount || 0,
        discount_amount: data.discountAmount || 0,
        total_amount: data.totalAmount || 0,
        deposit_amount: data.depositAmount || 0,
        balance_due: data.totalAmount || 0,
        payment_due_date: data.paymentDueDate,
        special_requests: data.specialRequests,
        internal_notes: data.internalNotes
      })
      .returning('*');

    // Add booking items if provided
    if (data.items && data.items.length > 0) {
      await this.addItems(booking.id, data.items);
    }

    return this.findById(booking.id);
  }

  /**
   * Update booking
   * @param {string} id - Booking ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  static async update(id, data) {
    const updateData = {};

    if (data.clientId) updateData.client_id = data.clientId;
    if (data.projectId !== undefined) updateData.project_id = data.projectId;
    if (data.status) updateData.status = data.status;
    if (data.pickupDatetime) updateData.pickup_datetime = data.pickupDatetime;
    if (data.returnDatetime) updateData.return_datetime = data.returnDatetime;
    if (data.pickupLocation !== undefined) updateData.pickup_location = data.pickupLocation;
    if (data.returnLocation !== undefined) updateData.return_location = data.returnLocation;
    if (data.shootLocation !== undefined) updateData.shoot_location = data.shootLocation;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
    if (data.taxAmount !== undefined) updateData.tax_amount = data.taxAmount;
    if (data.discountAmount !== undefined) updateData.discount_amount = data.discountAmount;
    if (data.totalAmount !== undefined) {
      updateData.total_amount = data.totalAmount;
      updateData.balance_due = data.totalAmount - (data.paidAmount || 0);
    }
    if (data.depositAmount !== undefined) updateData.deposit_amount = data.depositAmount;
    if (data.paidAmount !== undefined) {
      updateData.paid_amount = data.paidAmount;
      updateData.balance_due = (data.totalAmount || updateData.total_amount) - data.paidAmount;
    }
    if (data.paymentDueDate !== undefined) updateData.payment_due_date = data.paymentDueDate;
    if (data.coiReceived !== undefined) updateData.coi_received = data.coiReceived;
    if (data.coiUrl !== undefined) updateData.coi_url = data.coiUrl;
    if (data.coiExpiryDate !== undefined) updateData.coi_expiry_date = data.coiExpiryDate;
    if (data.contractSigned !== undefined) updateData.contract_signed = data.contractSigned;
    if (data.contractSignedAt) updateData.contract_signed_at = data.contractSignedAt;
    if (data.contractUrl !== undefined) updateData.contract_url = data.contractUrl;
    if (data.depositPaid !== undefined) updateData.deposit_paid = data.depositPaid;
    if (data.depositPaidAt) updateData.deposit_paid_at = data.depositPaidAt;
    if (data.specialRequests !== undefined) updateData.special_requests = data.specialRequests;
    if (data.internalNotes !== undefined) updateData.internal_notes = data.internalNotes;

    const [booking] = await db('bookings')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (!booking) {
      throw new NotFoundError('Booking');
    }

    return this.findById(id);
  }

  /**
   * Update booking status
   * @param {string} id - Booking ID
   * @param {string} newStatus - New status
   * @param {string} userId - User making the change
   * @param {string} reason - Reason for change
   * @returns {Promise<Object>}
   */
  static async updateStatus(id, newStatus, userId, reason = null) {
    const booking = await this.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking');
    }

    const oldStatus = booking.status;

    await db.transaction(async (trx) => {
      // Update booking status
      await trx('bookings')
        .where({ id })
        .update({ status: newStatus });

      // Log status change
      await trx('booking_status_history').insert({
        booking_id: id,
        from_status: oldStatus,
        to_status: newStatus,
        changed_by: userId,
        reason
      });
    });

    return this.findById(id);
  }

  /**
   * Delete booking (soft delete)
   * @param {string} id - Booking ID
   */
  static async delete(id) {
    const result = await db('bookings')
      .where({ id })
      .update({ deleted_at: new Date() });

    if (result === 0) {
      throw new NotFoundError('Booking');
    }
  }

  /**
   * List bookings with filters
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async list(filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = db('bookings')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .leftJoin('projects', 'bookings.project_id', 'projects.id')
      .whereNull('bookings.deleted_at')
      .orderBy('bookings.created_at', 'desc');

    if (filters.clientId) {
      query.where('bookings.client_id', filters.clientId);
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query.whereIn('bookings.status', filters.status);
      } else {
        query.where('bookings.status', filters.status);
      }
    }

    if (filters.type) {
      query.where('bookings.type', filters.type);
    }

    if (filters.startDate) {
      query.where('bookings.pickup_datetime', '>=', filters.startDate);
    }

    if (filters.endDate) {
      query.where('bookings.return_datetime', '<=', filters.endDate);
    }

    if (filters.search) {
      query.where(builder => {
        builder
          .where('bookings.booking_number', 'ilike', `%${filters.search}%`)
          .orWhere('clients.contact_name', 'ilike', `%${filters.search}%`)
          .orWhere('clients.company_name', 'ilike', `%${filters.search}%`);
      });
    }

    const offset = (pagination.page - 1) * pagination.limit;
    
    // Get total count (clone query and remove orderBy for counting)
    const countQuery = query.clone();
    countQuery.clear('order');
    
    const [countResult, rows] = await Promise.all([
      countQuery.count('* as count').first(),
      query
        .select(
          'bookings.*',
          'clients.company_name as client_company',
          'clients.contact_name as client_name',
          'projects.name as project_name'
        )
        .limit(pagination.limit)
        .offset(offset)
    ]);

    return {
      data: rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      }
    };
  }

  /**
   * Get booking items
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Array>}
   */
  static async getItems(bookingId) {
    return db('booking_items')
      .leftJoin('equipment', 'booking_items.equipment_id', 'equipment.id')
      .leftJoin('equipment_kits', 'booking_items.kit_id', 'equipment_kits.id')
      .where('booking_items.booking_id', bookingId)
      .select(
        'booking_items.*',
        'equipment.name as equipment_name',
        'equipment.sku as equipment_sku',
        'equipment_kits.name as kit_name'
      );
  }

  /**
   * Add items to booking
   * @param {string} bookingId - Booking ID
   * @param {Array} items - Items to add
   */
  static async addItems(bookingId, items) {
    const bookingItems = items.map(item => ({
      booking_id: bookingId,
      equipment_id: item.equipmentId,
      kit_id: item.kitId,
      quantity: item.quantity || 1,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      rental_days: item.rentalDays,
      notes: item.notes
    }));

    await db('booking_items').insert(bookingItems);
  }

  /**
   * Update booking item
   * @param {string} itemId - Item ID
   * @param {Object} data - Update data
   */
  static async updateItem(itemId, data) {
    const updateData = {};
    
    if (data.quantity) updateData.quantity = data.quantity;
    if (data.unitPrice !== undefined) updateData.unit_price = data.unitPrice;
    if (data.totalPrice !== undefined) updateData.total_price = data.totalPrice;
    if (data.status) updateData.status = data.status;
    if (data.pickedUpAt) updateData.picked_up_at = data.pickedUpAt;
    if (data.returnedAt) updateData.returned_at = data.returnedAt;
    if (data.conditionNotes !== undefined) updateData.condition_notes = data.conditionNotes;

    await db('booking_items')
      .where({ id: itemId })
      .update(updateData);
  }

  /**
   * Remove item from booking
   * @param {string} itemId - Item ID
   */
  static async removeItem(itemId) {
    await db('booking_items').where({ id: itemId }).delete();
  }

  /**
   * Get booking status history
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Array>}
   */
  static async getStatusHistory(bookingId) {
    return db('booking_status_history')
      .leftJoin('users', 'booking_status_history.changed_by', 'users.id')
      .where('booking_status_history.booking_id', bookingId)
      .orderBy('booking_status_history.created_at', 'desc')
      .select(
        'booking_status_history.*',
        db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'System') as changed_by_name")
      );
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
    
    // Get count of bookings this month
    const count = await db('bookings')
      .whereRaw("EXTRACT(YEAR FROM created_at) = ?", [date.getFullYear()])
      .whereRaw("EXTRACT(MONTH FROM created_at) = ?", [date.getMonth() + 1])
      .count('* as count')
      .first();
    
    const sequence = String(parseInt(count.count) + 1).padStart(4, '0');
    return `${prefix}${year}${month}${sequence}`;
  }

  /**
   * Get bookings requiring COI reminder
   * @param {number} hoursAgo - Hours since quote sent
   * @returns {Promise<Array>}
   */
  static async getCOIReminderBookings(hoursAgo = 24) {
    return db('bookings')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .where('bookings.status', 'quote_sent')
      .where('bookings.coi_received', false)
      .whereRaw(`bookings.updated_at <= NOW() - INTERVAL '${hoursAgo} hours'`)
      .whereNull('bookings.deleted_at')
      .select(
        'bookings.*',
        'clients.contact_name',
        'clients.email'
      );
  }

  /**
   * Get bookings requiring payment reminder
   * @param {number} hoursBefore - Hours before payment due
   * @returns {Promise<Array>}
   */
  static async getPaymentReminderBookings(hoursBefore = 48) {
    return db('bookings')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .whereIn('bookings.status', ['contract_signed', 'deposit_pending', 'confirmed'])
      .where('bookings.balance_due', '>', 0)
      .whereRaw(`bookings.payment_due_date <= NOW() + INTERVAL '${hoursBefore} hours'`)
      .whereNull('bookings.deleted_at')
      .select(
        'bookings.*',
        'clients.contact_name',
        'clients.email'
      );
  }

  /**
   * Get upcoming bookings for reminders
   * @param {number} hoursBefore - Hours before pickup
   * @returns {Promise<Array>}
   */
  static async getUpcomingBookings(hoursBefore = 24) {
    return db('bookings')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .whereIn('bookings.status', ['confirmed', 'deposit_pending'])
      .whereRaw(`bookings.pickup_datetime BETWEEN NOW() AND NOW() + INTERVAL '${hoursBefore} hours'`)
      .whereNull('bookings.deleted_at')
      .select(
        'bookings.*',
        'clients.contact_name',
        'clients.email',
        'clients.phone'
      );
  }

  /**
   * Get completed bookings for follow-up
   * @param {number} hoursAgo - Hours since return
   * @returns {Promise<Array>}
   */
  static async getCompletedBookingsForFollowUp(hoursAgo = 24) {
    return db('bookings')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .where('bookings.status', 'completed')
      .whereRaw(`bookings.return_datetime <= NOW() - INTERVAL '${hoursAgo} hours'`)
      .whereRaw(`bookings.return_datetime > NOW() - INTERVAL '${hoursAgo + 24} hours'`)
      .whereNull('bookings.deleted_at')
      .select(
        'bookings.*',
        'clients.contact_name',
        'clients.email'
      );
  }
}

module.exports = BookingModel;
