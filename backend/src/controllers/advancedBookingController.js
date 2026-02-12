const RecurringBookingModel = require('../models/RecurringBooking');
const BookingTemplateModel = require('../models/BookingTemplate');
const EquipmentWaitlistModel = require('../models/EquipmentWaitlist');
const BookingConflictModel = require('../models/BookingConflict');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Advanced Booking Controller
 * Handles recurring bookings, templates, waitlist, and conflicts
 */
class AdvancedBookingController {
  /**
   * Create recurring booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async createRecurring(req, res, next) {
    try {
      const {
        parentBookingId,
        frequency,
        interval,
        daysOfWeek,
        dayOfMonth,
        startDate,
        endDate,
        occurrences
      } = req.body;

      if (!parentBookingId || !frequency || !startDate) {
        throw new ValidationError('Parent booking, frequency, and start date are required');
      }

      const recurring = await RecurringBookingModel.create({
        parentBookingId,
        frequency,
        interval,
        daysOfWeek,
        dayOfMonth,
        startDate,
        endDate,
        occurrences,
        generateInstances: true
      });

      res.status(201).json({
        success: true,
        data: recurring
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recurring booking with instances
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getRecurring(req, res, next) {
    try {
      const { id } = req.params;
      
      const recurring = await RecurringBookingModel.findById(id);
      if (!recurring) {
        throw new NotFoundError('Recurring booking');
      }

      const instances = await RecurringBookingModel.getInstances(id);

      res.json({
        success: true,
        data: {
          ...recurring,
          instances
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List recurring bookings
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async listRecurring(req, res, next) {
    try {
      const { page = 1, limit = 20, status, clientId } = req.query;

      const result = await RecurringBookingModel.list(
        { status, clientId },
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
   * Update recurring booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async updateRecurring(req, res, next) {
    try {
      const { id } = req.params;
      const recurring = await RecurringBookingModel.update(id, req.body);

      res.json({
        success: true,
        data: recurring
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel recurring booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async cancelRecurring(req, res, next) {
    try {
      const { id } = req.params;
      await RecurringBookingModel.cancel(id, req.user.id);

      res.json({
        success: true,
        message: 'Recurring booking cancelled'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create booking template
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async createTemplate(req, res, next) {
    try {
      const {
        name,
        description,
        type,
        isPublic,
        defaultItems,
        defaultDates,
        defaultLocations,
        pricingRules,
        requiredDocuments,
        checklist
      } = req.body;

      const template = await BookingTemplateModel.create({
        name,
        description,
        type,
        createdBy: req.user.id,
        isPublic,
        defaultItems,
        defaultDates,
        defaultLocations,
        pricingRules,
        requiredDocuments,
        checklist
      });

      res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getTemplate(req, res, next) {
    try {
      const { id } = req.params;
      
      const template = await BookingTemplateModel.findById(id);
      if (!template) {
        throw new NotFoundError('Booking template');
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List templates
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async listTemplates(req, res, next) {
    try {
      const { page = 1, limit = 20, type, createdBy } = req.query;

      const result = await BookingTemplateModel.list(
        { userId: req.user.id, type, createdBy },
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
   * Apply template to create booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async applyTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const overrides = req.body;

      const result = await BookingTemplateModel.applyTemplate(id, overrides);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update template
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async updateTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const template = await BookingTemplateModel.update(id, req.body);

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete template
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async deleteTemplate(req, res, next) {
    try {
      const { id } = req.params;
      await BookingTemplateModel.delete(id);

      res.json({
        success: true,
        message: 'Template deleted'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clone template
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async cloneTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const { name, isPublic } = req.body;

      const template = await BookingTemplateModel.clone(id, { name, isPublic }, req.user.id);

      res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add to waitlist
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async addToWaitlist(req, res, next) {
    try {
      const {
        equipmentId,
        clientId,
        requestedStartDate,
        requestedEndDate,
        quantity,
        priority,
        notes
      } = req.body;

      if (!equipmentId || !clientId || !requestedStartDate || !requestedEndDate) {
        throw new ValidationError('Equipment, client, and dates are required');
      }

      const waitlist = await EquipmentWaitlistModel.create({
        equipmentId,
        clientId,
        requestedStartDate,
        requestedEndDate,
        quantity,
        priority,
        notes
      });

      res.status(201).json({
        success: true,
        data: waitlist
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get waitlist for equipment
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getEquipmentWaitlist(req, res, next) {
    try {
      const { equipmentId } = req.params;
      const { status, startDate, endDate } = req.query;

      const waitlist = await EquipmentWaitlistModel.getForEquipment(
        equipmentId,
        { status, startDate, endDate }
      );

      res.json({
        success: true,
        data: waitlist
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client waitlist
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getClientWaitlist(req, res, next) {
    try {
      const { clientId } = req.params;

      const waitlist = await EquipmentWaitlistModel.getForClient(clientId);

      res.json({
        success: true,
        data: waitlist
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all waitlist entries
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async listWaitlist(req, res, next) {
    try {
      const { page = 1, limit = 20, status, equipmentId, priority } = req.query;

      const result = await EquipmentWaitlistModel.list(
        { status, equipmentId, priority },
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
   * Update waitlist entry
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async updateWaitlist(req, res, next) {
    try {
      const { id } = req.params;
      const waitlist = await EquipmentWaitlistModel.update(id, req.body);

      res.json({
        success: true,
        data: waitlist
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Convert waitlist to booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async convertWaitlist(req, res, next) {
    try {
      const { id } = req.params;
      const { bookingId } = req.body;

      const waitlist = await EquipmentWaitlistModel.convertToBooking(id, bookingId);

      res.json({
        success: true,
        data: waitlist
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel waitlist entry
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async cancelWaitlist(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      await EquipmentWaitlistModel.cancel(id, reason);

      res.json({
        success: true,
        message: 'Waitlist entry cancelled'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get waitlist statistics
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getWaitlistStats(req, res, next) {
    try {
      const stats = await EquipmentWaitlistModel.getStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get conflicts for booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getBookingConflicts(req, res, next) {
    try {
      const { bookingId } = req.params;

      const conflicts = await BookingConflictModel.getForBooking(bookingId);

      res.json({
        success: true,
        data: conflicts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Detect conflicts for booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async detectConflicts(req, res, next) {
    try {
      const { bookingId } = req.params;

      const conflicts = await BookingConflictModel.detectConflicts(bookingId);

      res.json({
        success: true,
        data: conflicts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get equipment availability timeline
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getAvailabilityTimeline(req, res, next) {
    try {
      const { equipmentId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError('Start and end dates are required');
      }

      const timeline = await BookingConflictModel.getAvailabilityTimeline(
        equipmentId,
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: timeline
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get conflict statistics
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getConflictStats(req, res, next) {
    try {
      const stats = await BookingConflictModel.getStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve conflict
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async resolveConflict(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const conflict = await BookingConflictModel.resolve(id, {
        notes,
        resolvedBy: req.user.id
      });

      res.json({
        success: true,
        data: conflict
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdvancedBookingController();
