const EmployeeModel = require('../models/Employee');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Team Management Controller
 * Handles employee profiles, assignments, and scheduling
 */
class TeamManagementController {
  /**
   * Create employee profile
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async createEmployee(req, res, next) {
    try {
      const employee = await EmployeeModel.create({
        ...req.body,
        hireDate: req.body.hireDate || new Date()
      });

      res.status(201).json({
        success: true,
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employee by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getEmployee(req, res, next) {
    try {
      const { id } = req.params;
      
      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        throw new NotFoundError('Employee');
      }

      // Get recent assignments
      const assignments = await EmployeeModel.getAssignments(id, { limit: 5 });

      // Get time summary for current week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const timeSummary = await EmployeeModel.getTimeSummary(id, weekStart, weekEnd);

      res.json({
        success: true,
        data: {
          ...employee,
          recentAssignments: assignments.slice(0, 5),
          weekTimeSummary: timeSummary
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update employee
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      
      const employee = await EmployeeModel.update(id, req.body);

      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List employees
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async listEmployees(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status,
        department,
        employmentType,
        skill,
        search
      } = req.query;

      const result = await EmployeeModel.list(
        { status, department, employmentType, skill, search },
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
   * Get departments list
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getDepartments(req, res, next) {
    try {
      const departments = await EmployeeModel.getDepartments();

      res.json({
        success: true,
        data: departments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign employee to booking
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async assignToBooking(req, res, next) {
    try {
      const { bookingId, employeeId, role, responsibilities, scheduledStart, scheduledEnd } = req.body;

      if (!bookingId || !employeeId || !role) {
        throw new ValidationError('Booking ID, employee ID, and role are required');
      }

      const assignment = await EmployeeModel.assignToBooking({
        bookingId,
        employeeId,
        role,
        responsibilities,
        scheduledStart,
        scheduledEnd,
        assignedBy: req.user.id
      });

      res.status(201).json({
        success: true,
        data: assignment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employee assignments
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getEmployeeAssignments(req, res, next) {
    try {
      const { id } = req.params;
      const { status, startDate, endDate } = req.query;

      const assignments = await EmployeeModel.getAssignments(id, { status, startDate, endDate });

      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get booking assignments
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getBookingAssignments(req, res, next) {
    try {
      const { bookingId } = req.params;

      const assignments = await EmployeeModel.getBookingAssignments(bookingId);

      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update assignment
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async updateAssignment(req, res, next) {
    try {
      const { assignmentId } = req.params;
      
      const assignment = await EmployeeModel.updateAssignment(assignmentId, req.body);

      res.json({
        success: true,
        data: assignment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employee availability
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError('Start and end dates are required');
      }

      const availability = await EmployeeModel.getAvailability(
        id,
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: availability
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set availability
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async setAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const { date, startTime, endTime, status, type, reason, bookingId } = req.body;

      if (!date || !startTime || !endTime) {
        throw new ValidationError('Date, start time, and end time are required');
      }

      const availability = await EmployeeModel.setAvailability({
        employeeId: id,
        date,
        startTime,
        endTime,
        status,
        type,
        reason,
        bookingId
      });

      res.status(201).json({
        success: true,
        data: availability
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clock in
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async clockIn(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { type, bookingId, projectId, location, notes } = req.body;

      const entry = await EmployeeModel.clockIn({
        employeeId,
        type,
        bookingId,
        projectId,
        location,
        ipAddress: req.ip,
        notes
      });

      res.status(201).json({
        success: true,
        data: entry
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clock out
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async clockOut(req, res, next) {
    try {
      const { entryId } = req.params;
      const { location, notes } = req.body;

      const entry = await EmployeeModel.clockOut(entryId, { location, notes });

      res.json({
        success: true,
        data: entry
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get time entries
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getTimeEntries(req, res, next) {
    try {
      const { id } = req.params;
      const { status, startDate, endDate } = req.query;

      const entries = await EmployeeModel.getTimeEntries(id, { status, startDate, endDate });

      res.json({
        success: true,
        data: entries
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get time summary for payroll
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getTimeSummary(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError('Start and end dates are required');
      }

      const summary = await EmployeeModel.getTimeSummary(
        id,
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get skill categories
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getSkillCategories(req, res, next) {
    try {
      const categories = await EmployeeModel.getSkillCategories();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's employee profile
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getMyProfile(req, res, next) {
    try {
      const employee = await EmployeeModel.findByUserId(req.user.id);
      
      if (!employee) {
        throw new NotFoundError('Employee profile not found');
      }

      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeamManagementController();
