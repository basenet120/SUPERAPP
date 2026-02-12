const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');

/**
 * Employee Model
 * Manage employee profiles, assignments, and availability
 */
class EmployeeModel {
  /**
   * Create employee profile
   * @param {Object} data - Employee data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const [employee] = await db('employee_profiles')
      .insert({
        user_id: data.userId,
        employee_id: data.employeeId,
        hire_date: data.hireDate,
        employment_type: data.employmentType,
        department: data.department,
        job_title: data.jobTitle,
        manager_id: data.managerId,
        skills: JSON.stringify(data.skills || []),
        certifications: JSON.stringify(data.certifications || []),
        equipment_specializations: JSON.stringify(data.equipmentSpecializations || []),
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactPhone,
        address: data.address,
        birth_date: data.birthDate,
        hourly_rate: data.hourlyRate,
        salary: data.salary,
        pay_schedule: data.paySchedule,
        max_hours_per_week: data.maxHoursPerWeek,
        notes: data.notes
      })
      .returning('*');

    return this.findById(employee.id);
  }

  /**
   * Find employee by ID
   * @param {string} id - Employee ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const employee = await db('employee_profiles')
      .leftJoin('users', 'employee_profiles.user_id', 'users.id')
      .leftJoin('users as manager', 'employee_profiles.manager_id', 'manager.id')
      .where('employee_profiles.id', id)
      .select(
        'employee_profiles.*',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.phone',
        db.raw("COALESCE(manager.first_name || ' ' || manager.last_name, null) as manager_name")
      )
      .first();

    if (!employee) return null;

    return this.formatEmployee(employee);
  }

  /**
   * Find employee by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  static async findByUserId(userId) {
    const employee = await db('employee_profiles')
      .leftJoin('users', 'employee_profiles.user_id', 'users.id')
      .leftJoin('users as manager', 'employee_profiles.manager_id', 'manager.id')
      .where('employee_profiles.user_id', userId)
      .select(
        'employee_profiles.*',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.phone',
        db.raw("COALESCE(manager.first_name || ' ' || manager.last_name, null) as manager_name")
      )
      .first();

    if (!employee) return null;

    return this.formatEmployee(employee);
  }

  /**
   * Update employee
   * @param {string} id - Employee ID
   * @param {Object} data - Update data
   */
  static async update(id, data) {
    const updateData = {};

    if (data.employeeId) updateData.employee_id = data.employeeId;
    if (data.hireDate) updateData.hire_date = data.hireDate;
    if (data.terminationDate !== undefined) updateData.termination_date = data.terminationDate;
    if (data.employmentType) updateData.employment_type = data.employmentType;
    if (data.status) updateData.status = data.status;
    if (data.department) updateData.department = data.department;
    if (data.jobTitle) updateData.job_title = data.jobTitle;
    if (data.managerId !== undefined) updateData.manager_id = data.managerId;
    if (data.skills) updateData.skills = JSON.stringify(data.skills);
    if (data.certifications) updateData.certifications = JSON.stringify(data.certifications);
    if (data.equipmentSpecializations) updateData.equipment_specializations = JSON.stringify(data.equipmentSpecializations);
    if (data.emergencyContactName) updateData.emergency_contact_name = data.emergencyContactName;
    if (data.emergencyContactPhone) updateData.emergency_contact_phone = data.emergencyContactPhone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.hourlyRate !== undefined) updateData.hourly_rate = data.hourlyRate;
    if (data.salary !== undefined) updateData.salary = data.salary;
    if (data.paySchedule) updateData.pay_schedule = data.paySchedule;
    if (data.maxHoursPerWeek !== undefined) updateData.max_hours_per_week = data.maxHoursPerWeek;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [employee] = await db('employee_profiles')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (!employee) {
      throw new NotFoundError('Employee');
    }

    return this.findById(id);
  }

  /**
   * List employees
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async list(filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = db('employee_profiles')
      .leftJoin('users', 'employee_profiles.user_id', 'users.id')
      .leftJoin('users as manager', 'employee_profiles.manager_id', 'manager.id')
      .orderBy('users.last_name');

    if (filters.status) {
      query.where('employee_profiles.status', filters.status);
    }

    if (filters.department) {
      query.where('employee_profiles.department', filters.department);
    }

    if (filters.employmentType) {
      query.where('employee_profiles.employment_type', filters.employmentType);
    }

    if (filters.skill) {
      query.whereRaw('employee_profiles.skills @> ?', [JSON.stringify([filters.skill])]);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query.where(function() {
        this.where('users.first_name', 'ilike', searchTerm)
          .orWhere('users.last_name', 'ilike', searchTerm)
          .orWhere('users.email', 'ilike', searchTerm)
          .orWhere('employee_profiles.job_title', 'ilike', searchTerm);
      });
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [countResult, rows] = await Promise.all([
      query.clone().count('* as count').first(),
      query
        .select(
          'employee_profiles.*',
          'users.email',
          'users.first_name',
          'users.last_name',
          'users.phone',
          db.raw("COALESCE(manager.first_name || ' ' || manager.last_name, null) as manager_name")
        )
        .limit(pagination.limit)
        .offset(offset)
    ]);

    return {
      data: rows.map(this.formatEmployee),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      }
    };
  }

  /**
   * Assign employee to booking
   * @param {Object} data - Assignment data
   * @returns {Promise<Object>}
   */
  static async assignToBooking(data) {
    const [assignment] = await db('booking_assignments')
      .insert({
        booking_id: data.bookingId,
        employee_id: data.employeeId,
        role: data.role,
        responsibilities: data.responsibilities,
        scheduled_start: data.scheduledStart,
        scheduled_end: data.scheduledEnd,
        assigned_by: data.assignedBy
      })
      .returning('*');

    return assignment;
  }

  /**
   * Get employee assignments
   * @param {string} employeeId - Employee ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>}
   */
  static async getAssignments(employeeId, filters = {}) {
    const query = db('booking_assignments')
      .leftJoin('bookings', 'booking_assignments.booking_id', 'bookings.id')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .where('booking_assignments.employee_id', employeeId)
      .orderBy('booking_assignments.scheduled_start', 'desc');

    if (filters.status) {
      query.where('booking_assignments.status', filters.status);
    }

    if (filters.startDate) {
      query.where('booking_assignments.scheduled_start', '>=', filters.startDate);
    }

    if (filters.endDate) {
      query.where('booking_assignments.scheduled_end', '<=', filters.endDate);
    }

    return query.select(
      'booking_assignments.*',
      'bookings.booking_number',
      'bookings.pickup_datetime',
      'bookings.return_datetime',
      'bookings.shoot_location',
      'clients.contact_name as client_name'
    );
  }

  /**
   * Get booking assignments
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Array>}
   */
  static async getBookingAssignments(bookingId) {
    return db('booking_assignments')
      .leftJoin('employee_profiles', 'booking_assignments.employee_id', 'employee_profiles.id')
      .leftJoin('users', 'employee_profiles.user_id', 'users.id')
      .where('booking_assignments.booking_id', bookingId)
      .select(
        'booking_assignments.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'employee_profiles.job_title'
      );
  }

  /**
   * Update assignment status
   * @param {string} assignmentId - Assignment ID
   * @param {Object} data - Update data
   */
  static async updateAssignment(assignmentId, data) {
    const updateData = {};

    if (data.status) updateData.status = data.status;
    if (data.actualStart) updateData.actual_start = data.actualStart;
    if (data.actualEnd) updateData.actual_end = data.actualEnd;
    if (data.checkInNotes !== undefined) updateData.check_in_notes = data.checkInNotes;
    if (data.checkOutNotes !== undefined) updateData.check_out_notes = data.checkOutNotes;

    const [assignment] = await db('booking_assignments')
      .where({ id: assignmentId })
      .update(updateData)
      .returning('*');

    if (!assignment) {
      throw new NotFoundError('Assignment');
    }

    return assignment;
  }

  /**
   * Get employee availability
   * @param {string} employeeId - Employee ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>}
   */
  static async getAvailability(employeeId, startDate, endDate) {
    return db('employee_availability')
      .where('employee_id', employeeId)
      .whereBetween('date', [startDate, endDate])
      .orderBy('date')
      .orderBy('start_time');
  }

  /**
   * Set availability
   * @param {Object} data - Availability data
   * @returns {Promise<Object>}
   */
  static async setAvailability(data) {
    // Check for conflicts with existing assignments
    const conflicts = await db('booking_assignments')
      .where('employee_id', data.employeeId)
      .whereIn('status', ['scheduled', 'confirmed', 'in_progress'])
      .where(function() {
        this.whereBetween('scheduled_start', [data.startTime, data.endTime])
          .orWhereBetween('scheduled_end', [data.startTime, data.endTime]);
      })
      .first();

    if (conflicts && data.status === 'unavailable') {
      throw new Error('Cannot mark as unavailable - has scheduled assignments');
    }

    const [availability] = await db('employee_availability')
      .insert({
        employee_id: data.employeeId,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        status: data.status,
        type: data.type,
        reason: data.reason,
        booking_id: data.bookingId
      })
      .returning('*');

    return availability;
  }

  /**
   * Clock in
   * @param {Object} data - Clock in data
   * @returns {Promise<Object>}
   */
  static async clockIn(data) {
    const [entry] = await db('time_entries')
      .insert({
        employee_id: data.employeeId,
        clock_in: new Date(),
        type: data.type || 'regular',
        booking_id: data.bookingId,
        project_id: data.projectId,
        clock_in_location: data.location ? JSON.stringify(data.location) : null,
        ip_address: data.ipAddress,
        verification_method: data.verificationMethod,
        notes: data.notes
      })
      .returning('*');

    return entry;
  }

  /**
   * Clock out
   * @param {string} entryId - Time entry ID
   * @param {Object} data - Clock out data
   * @returns {Promise<Object>}
   */
  static async clockOut(entryId, data) {
    const entry = await db('time_entries').where({ id: entryId }).first();
    if (!entry) {
      throw new NotFoundError('Time entry');
    }

    const clockOut = new Date();
    const duration = Math.floor((clockOut - new Date(entry.clock_in)) / 1000); // seconds

    const [updated] = await db('time_entries')
      .where({ id: entryId })
      .update({
        clock_out: clockOut,
        duration: `${Math.floor(duration / 3600)} hours ${Math.floor((duration % 3600) / 60)} minutes`,
        clock_out_location: data.location ? JSON.stringify(data.location) : null,
        notes: data.notes || entry.notes
      })
      .returning('*');

    return updated;
  }

  /**
   * Get time entries
   * @param {string} employeeId - Employee ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>}
   */
  static async getTimeEntries(employeeId, filters = {}) {
    const query = db('time_entries')
      .where('employee_id', employeeId)
      .orderBy('clock_in', 'desc');

    if (filters.status) {
      query.where('status', filters.status);
    }

    if (filters.startDate) {
      query.where('clock_in', '>=', filters.startDate);
    }

    if (filters.endDate) {
      query.where('clock_in', '<=', filters.endDate);
    }

    return query;
  }

  /**
   * Get time summary for payroll
   * @param {string} employeeId - Employee ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>}
   */
  static async getTimeSummary(employeeId, startDate, endDate) {
    const summary = await db('time_entries')
      .where('employee_id', employeeId)
      .where('clock_in', '>=', startDate)
      .where('clock_in', '<=', endDate)
      .whereNotNull('clock_out')
      .select(
        'type',
        db.raw('COUNT(*) as entry_count'),
        db.raw('SUM(EXTRACT(EPOCH FROM duration)) as total_seconds')
      )
      .groupBy('type');

    const result = {
      regular: 0,
      overtime: 0,
      break: 0,
      total: 0,
      entryCount: 0
    };

    for (const row of summary) {
      const hours = (row.total_seconds || 0) / 3600;
      result[row.type] = hours;
      result.total += hours;
      result.entryCount += parseInt(row.entry_count);
    }

    return result;
  }

  /**
   * Get skill categories
   * @returns {Promise<Array>}
   */
  static async getSkillCategories() {
    return db('skill_categories').orderBy('name');
  }

  /**
   * Format employee object
   * @param {Object} employee - Raw employee data
   * @returns {Object} Formatted employee
   */
  static formatEmployee(employee) {
    return {
      ...employee,
      skills: employee.skills ? JSON.parse(employee.skills) : [],
      certifications: employee.certifications ? JSON.parse(employee.certifications) : [],
      equipmentSpecializations: employee.equipment_specializations ? 
        JSON.parse(employee.equipment_specializations) : [],
      availabilitySchedule: employee.availability_schedule ? 
        JSON.parse(employee.availability_schedule) : {},
      name: `${employee.first_name} ${employee.last_name}`
    };
  }
}

module.exports = EmployeeModel;
