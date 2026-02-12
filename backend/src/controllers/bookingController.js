const BookingModel = require('../models/Booking');
const EquipmentModel = require('../models/Equipment');
const { logAudit } = require('../utils/audit');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');

class BookingController {
  /**
   * List bookings
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async list(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        clientId, 
        status, 
        type,
        startDate,
        endDate,
        search 
      } = req.query;

      // If user is a client, only show their bookings
      const filters = { clientId, status, type, startDate, endDate, search };
      
      if (req.user.roles.includes('client') && !req.user.roles.includes('admin')) {
        // TODO: Filter by user's client record
      }

      const result = await BookingModel.list(
        filters,
        { page: parseInt(page), limit: parseInt(limit) }
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get booking by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const booking = await BookingModel.findById(id);

      if (!booking) {
        throw new NotFoundError('Booking');
      }

      // Check ownership for clients
      if (req.user.roles.includes('client') && !req.user.roles.includes('admin')) {
        // TODO: Check if booking belongs to user's client record
      }

      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async create(req, res, next) {
    try {
      const data = req.body;
      data.createdBy = req.user.id;

      // Validate required fields
      if (!data.clientId) {
        throw new ValidationError('Client ID is required');
      }

      if (!data.items || data.items.length === 0) {
        throw new ValidationError('At least one item is required');
      }

      // Check availability for all items
      for (const item of data.items) {
        if (item.equipmentId) {
          const isAvailable = await EquipmentModel.checkAvailability(
            item.equipmentId,
            new Date(data.pickupDatetime),
            new Date(data.returnDatetime)
          );

          if (!isAvailable) {
            throw new ConflictError(`Equipment ${item.equipmentId} is not available for selected dates`);
          }
        }
      }

      const booking = await BookingModel.create(data);

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'create',
        resource: 'booking',
        resourceId: booking.id,
        newValues: data,
        req
      });

      res.status(201).json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      
      const oldBooking = await BookingModel.findById(id);
      if (!oldBooking) {
        throw new NotFoundError('Booking');
      }

      const booking = await BookingModel.update(id, req.body);

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'update',
        resource: 'booking',
        resourceId: id,
        oldValues: oldBooking,
        newValues: booking,
        req
      });

      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update booking status
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        throw new ValidationError('Status is required');
      }

      const booking = await BookingModel.updateStatus(id, status, req.user.id, reason);

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'status_change',
        resource: 'booking',
        resourceId: id,
        newValues: { status, reason },
        req
      });

      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await BookingModel.delete(id);

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'delete',
        resource: 'booking',
        resourceId: id,
        req
      });

      res.json({
        success: true,
        message: 'Booking deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add item to booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async addItem(req, res, next) {
    try {
      const { id } = req.params;
      const item = req.body;

      const booking = await BookingModel.findById(id);
      if (!booking) {
        throw new NotFoundError('Booking');
      }

      // Check availability
      if (item.equipmentId) {
        const isAvailable = await EquipmentModel.checkAvailability(
          item.equipmentId,
          new Date(booking.pickup_datetime),
          new Date(booking.return_datetime),
          id
        );

        if (!isAvailable) {
          throw new ConflictError('Equipment is not available for selected dates');
        }
      }

      await BookingModel.addItems(id, [item]);

      const updated = await BookingModel.findById(id);

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update booking item
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async updateItem(req, res, next) {
    try {
      const { itemId } = req.params;
      
      await BookingModel.updateItem(itemId, req.body);

      res.json({
        success: true,
        message: 'Item updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove item from booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async removeItem(req, res, next) {
    try {
      const { itemId } = req.params;

      await BookingModel.removeItem(itemId);

      res.json({
        success: true,
        message: 'Item removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get booking status history
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getStatusHistory(req, res, next) {
    try {
      const { id } = req.params;

      const history = await BookingModel.getStatusHistory(id);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate booking pricing
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async calculatePricing(req, res, next) {
    try {
      const { items, pickupDate, returnDate, discountCode } = req.body;

      if (!items || !pickupDate || !returnDate) {
        throw new ValidationError('Items, pickup date, and return date are required');
      }

      const pickup = new Date(pickupDate);
      const return_ = new Date(returnDate);
      const days = Math.ceil((return_ - pickup) / (1000 * 60 * 60 * 24));

      let subtotal = 0;
      const itemPricing = [];

      for (const item of items) {
        const equipment = await EquipmentModel.findById(item.equipmentId);
        if (!equipment) {
          throw new NotFoundError(`Equipment ${item.equipmentId}`);
        }

        const pricing = EquipmentModel.calculatePricing(equipment, days);
        subtotal += pricing.total;

        itemPricing.push({
          equipmentId: item.equipmentId,
          equipmentName: equipment.name,
          ...pricing
        });
      }

      // Calculate totals
      const taxRate = 0.0875; // 8.75% tax
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      res.json({
        success: true,
        data: {
          days,
          itemPricing,
          subtotal: parseFloat(subtotal.toFixed(2)),
          taxRate: taxRate * 100,
          taxAmount: parseFloat(taxAmount.toFixed(2)),
          total: parseFloat(total.toFixed(2))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard stats
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getDashboardStats(req, res, next) {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today - 30 * 24 * 60 * 60 * 1000);

      const [
        totalBookings,
        activeBookings,
        pendingQuotes,
        revenueResult
      ] = await Promise.all([
        // Total bookings
        db('bookings').whereNull('deleted_at').count('* as count').first(),
        // Active bookings
        db('bookings')
          .whereIn('status', ['confirmed', 'in_progress'])
          .whereNull('deleted_at')
          .count('* as count')
          .first(),
        // Pending quotes
        db('bookings')
          .where('status', 'quote_sent')
          .whereNull('deleted_at')
          .count('* as count')
          .first(),
        // Revenue last 30 days
        db('bookings')
          .where('status', 'in', ['completed', 'in_progress'])
          .where('created_at', '>=', thirtyDaysAgo)
          .sum('total_amount as total')
          .first()
      ]);

      res.json({
        success: true,
        data: {
          totalBookings: parseInt(totalBookings.count),
          activeBookings: parseInt(activeBookings.count),
          pendingQuotes: parseInt(pendingQuotes.count),
          revenueLast30Days: parseFloat(revenueResult.total || 0)
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();
