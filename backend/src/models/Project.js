const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');

/**
 * Project Model
 * Manage projects, milestones, tasks, and project teams
 */
class ProjectModel {
  /**
   * Create project
   * @param {Object} data - Project data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const [project] = await db('projects')
      .insert({
        name: data.name,
        description: data.description,
        client_id: data.clientId,
        company_id: data.companyId,
        status: data.status || 'planning',
        priority: data.priority || 'medium',
        type: data.type || 'production',
        budget: data.budget,
        start_date: data.startDate,
        end_date: data.endDate,
        project_manager_id: data.projectManagerId,
        booking_id: data.bookingId,
        notes: data.notes
      })
      .returning('*');

    return this.findById(project.id);
  }

  /**
   * Find project by ID with full details
   * @param {string} id - Project ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const project = await db('projects')
      .leftJoin('clients', 'projects.client_id', 'clients.id')
      .leftJoin('companies', 'projects.company_id', 'companies.id')
      .leftJoin('users', 'projects.project_manager_id', 'users.id')
      .leftJoin('bookings', 'projects.booking_id', 'bookings.id')
      .where('projects.id', id)
      .select(
        'projects.*',
        'clients.contact_name as client_name',
        'clients.email as client_email',
        'companies.name as company_name',
        db.raw("COALESCE(users.first_name || ' ' || users.last_name, null) as project_manager_name"),
        'bookings.booking_number'
      )
      .first();

    if (!project) return null;

    return this.formatProject(project);
  }

  /**
   * Update project
   * @param {string} id - Project ID
   * @param {Object} data - Update data
   */
  static async update(id, data) {
    const updateData = {};

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.clientId !== undefined) updateData.client_id = data.clientId;
    if (data.companyId !== undefined) updateData.company_id = data.companyId;
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.type) updateData.type = data.type;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.actualCost !== undefined) updateData.actual_cost = data.actualCost;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.actualStartDate !== undefined) updateData.actual_start_date = data.actualStartDate;
    if (data.actualEndDate !== undefined) updateData.actual_end_date = data.actualEndDate;
    if (data.projectManagerId !== undefined) updateData.project_manager_id = data.projectManagerId;
    if (data.progressPercentage !== undefined) updateData.progress_percentage = data.progressPercentage;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [project] = await db('projects')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (!project) {
      throw new NotFoundError('Project');
    }

    return this.findById(id);
  }

  /**
   * List projects
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async list(filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = db('projects')
      .leftJoin('clients', 'projects.client_id', 'clients.id')
      .leftJoin('companies', 'projects.company_id', 'companies.id')
      .leftJoin('users', 'projects.project_manager_id', 'users.id')
      .orderBy('projects.created_at', 'desc');

    if (filters.status) {
      query.where('projects.status', filters.status);
    }

    if (filters.priority) {
      query.where('projects.priority', filters.priority);
    }

    if (filters.type) {
      query.where('projects.type', filters.type);
    }

    if (filters.clientId) {
      query.where('projects.client_id', filters.clientId);
    }

    if (filters.projectManagerId) {
      query.where('projects.project_manager_id', filters.projectManagerId);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query.where(function() {
        this.where('projects.name', 'ilike', searchTerm)
          .orWhere('projects.description', 'ilike', searchTerm)
          .orWhere('clients.contact_name', 'ilike', searchTerm)
          .orWhere('companies.name', 'ilike', searchTerm);
      });
    }

    if (filters.dateFrom) {
      query.where('projects.start_date', '>=', filters.dateFrom);
    }

    if (filters.dateTo) {
      query.where('projects.end_date', '<=', filters.dateTo);
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [countResult, rows] = await Promise.all([
      query.clone().count('* as count').first(),
      query
        .select(
          'projects.*',
          'clients.contact_name as client_name',
          'companies.name as company_name',
          db.raw("COALESCE(users.first_name || ' ' || users.last_name, null) as project_manager_name")
        )
        .limit(pagination.limit)
        .offset(offset)
    ]);

    return {
      data: rows.map(this.formatProject),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      }
    };
  }

  /**
   * Delete project
   * @param {string} id - Project ID
   */
  static async delete(id) {
    await db('projects').where({ id }).del();
  }

  // ==================== MILESTONES ====================

  /**
   * Create milestone
   * @param {Object} data - Milestone data
   */
  static async createMilestone(data) {
    const [milestone] = await db('milestones')
      .insert({
        project_id: data.projectId,
        name: data.name,
        description: data.description,
        due_date: data.dueDate,
        status: data.status || 'pending',
        dependencies: JSON.stringify(data.dependencies || []),
        deliverables: JSON.stringify(data.deliverables || []),
        order_index: data.orderIndex || 0
      })
      .returning('*');

    return this.formatMilestone(milestone);
  }

  /**
   * Get project milestones
   * @param {string} projectId - Project ID
   */
  static async getMilestones(projectId) {
    const milestones = await db('milestones')
      .where('project_id', projectId)
      .orderBy('order_index');

    return milestones.map(this.formatMilestone);
  }

  /**
   * Update milestone
   * @param {string} id - Milestone ID
   * @param {Object} data - Update data
   */
  static async updateMilestone(id, data) {
    const updateData = {};

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate) updateData.due_date = data.dueDate;
    if (data.completedDate !== undefined) updateData.completed_date = data.completedDate;
    if (data.status) updateData.status = data.status;
    if (data.dependencies) updateData.dependencies = JSON.stringify(data.dependencies);
    if (data.deliverables) updateData.deliverables = JSON.stringify(data.deliverables);
    if (data.orderIndex !== undefined) updateData.order_index = data.orderIndex;

    const [milestone] = await db('milestones')
      .where({ id })
      .update(updateData)
      .returning('*');

    return milestone ? this.formatMilestone(milestone) : null;
  }

  /**
   * Delete milestone
   * @param {string} id - Milestone ID
   */
  static async deleteMilestone(id) {
    await db('milestones').where({ id }).del();
  }

  // ==================== TASKS ====================

  /**
   * Create task
   * @param {Object} data - Task data
   */
  static async createTask(data) {
    const [task] = await db('tasks')
      .insert({
        project_id: data.projectId,
        milestone_id: data.milestoneId,
        title: data.title,
        description: data.description,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        assignee_id: data.assigneeId,
        created_by: data.createdBy,
        start_date: data.startDate,
        due_date: data.dueDate,
        estimated_hours: data.estimatedHours,
        dependencies: JSON.stringify(data.dependencies || []),
        parent_task_id: data.parentTaskId,
        position: data.position || 0,
        tags: data.tags
      })
      .returning('*');

    return this.formatTask(task);
  }

  /**
   * Get project tasks
   * @param {string} projectId - Project ID
   * @param {Object} filters - Optional filters
   */
  static async getTasks(projectId, filters = {}) {
    const query = db('tasks')
      .leftJoin('employee_profiles', 'tasks.assignee_id', 'employee_profiles.id')
      .leftJoin('users', 'employee_profiles.user_id', 'users.id')
      .where('tasks.project_id', projectId);

    if (filters.status) {
      query.where('tasks.status', filters.status);
    }

    if (filters.assigneeId) {
      query.where('tasks.assignee_id', filters.assigneeId);
    }

    if (filters.milestoneId) {
      query.where('tasks.milestone_id', filters.milestoneId);
    }

    const tasks = await query
      .select(
        'tasks.*',
        db.raw("COALESCE(users.first_name || ' ' || users.last_name, null) as assignee_name")
      )
      .orderBy('tasks.position')
      .orderBy('tasks.created_at');

    return tasks.map(this.formatTask);
  }

  /**
   * Get task by ID
   * @param {string} id - Task ID
   */
  static async getTaskById(id) {
    const task = await db('tasks')
      .leftJoin('employee_profiles', 'tasks.assignee_id', 'employee_profiles.id')
      .leftJoin('users as assignee', 'employee_profiles.user_id', 'assignee.id')
      .leftJoin('users as creator', 'tasks.created_by', 'creator.id')
      .where('tasks.id', id)
      .select(
        'tasks.*',
        db.raw("COALESCE(assignee.first_name || ' ' || assignee.last_name, null) as assignee_name"),
        db.raw("COALESCE(creator.first_name || ' ' || creator.last_name, null) as created_by_name")
      )
      .first();

    return task ? this.formatTask(task) : null;
  }

  /**
   * Update task
   * @param {string} id - Task ID
   * @param {Object} data - Update data
   */
  static async updateTask(id, data) {
    const updateData = {};

    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.assigneeId !== undefined) updateData.assignee_id = data.assigneeId;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.completedDate !== undefined) updateData.completed_date = data.completedDate;
    if (data.estimatedHours !== undefined) updateData.estimated_hours = data.estimatedHours;
    if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours;
    if (data.dependencies) updateData.dependencies = JSON.stringify(data.dependencies);
    if (data.milestoneId !== undefined) updateData.milestone_id = data.milestoneId;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.tags !== undefined) updateData.tags = data.tags;

    const [task] = await db('tasks')
      .where({ id })
      .update(updateData)
      .returning('*');

    return task ? this.formatTask(task) : null;
  }

  /**
   * Delete task
   * @param {string} id - Task ID
   */
  static async deleteTask(id) {
    await db('tasks').where({ id }).del();
  }

  /**
   * Get task comments
   * @param {string} taskId - Task ID
   */
  static async getTaskComments(taskId) {
    return db('task_comments')
      .leftJoin('users', 'task_comments.user_id', 'users.id')
      .where('task_comments.task_id', taskId)
      .select(
        'task_comments.*',
        db.raw("users.first_name || ' ' || users.last_name as user_name")
      )
      .orderBy('task_comments.created_at', 'asc');
  }

  /**
   * Add task comment
   * @param {Object} data - Comment data
   */
  static async addTaskComment(data) {
    const [comment] = await db('task_comments')
      .insert({
        task_id: data.taskId,
        user_id: data.userId,
        content: data.content,
        type: data.type || 'comment',
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      })
      .returning('*');

    return comment;
  }

  // ==================== PROJECT MEMBERS ====================

  /**
   * Add member to project
   * @param {Object} data - Member data
   */
  static async addProjectMember(data) {
    const [member] = await db('project_members')
      .insert({
        project_id: data.projectId,
        employee_id: data.employeeId,
        role: data.role || 'member',
        responsibilities: data.responsibilities,
        joined_date: data.joinedDate || new Date()
      })
      .returning('*');

    return member;
  }

  /**
   * Get project members
   * @param {string} projectId - Project ID
   */
  static async getProjectMembers(projectId) {
    return db('project_members')
      .leftJoin('employee_profiles', 'project_members.employee_id', 'employee_profiles.id')
      .leftJoin('users', 'employee_profiles.user_id', 'users.id')
      .where('project_members.project_id', projectId)
      .whereNull('project_members.left_date')
      .select(
        'project_members.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'employee_profiles.job_title',
        db.raw("users.first_name || ' ' || users.last_name as name")
      )
      .orderBy('project_members.joined_date');
  }

  /**
   * Remove member from project
   * @param {string} projectId - Project ID
   * @param {string} employeeId - Employee ID
   */
  static async removeProjectMember(projectId, employeeId) {
    await db('project_members')
      .where({ project_id: projectId, employee_id: employeeId })
      .update({ left_date: new Date() });
  }

  // ==================== TIME TRACKING ====================

  /**
   * Log time on task
   * @param {Object} data - Time entry data
   */
  static async logTaskTime(data) {
    const [entry] = await db('task_time_entries')
      .insert({
        task_id: data.taskId,
        employee_id: data.employeeId,
        started_at: data.startedAt,
        ended_at: data.endedAt,
        duration_minutes: data.durationMinutes,
        description: data.description,
        billable: data.billable !== false
      })
      .returning('*');

    // Update actual hours on task
    if (data.durationMinutes) {
      await db('tasks')
        .where('id', data.taskId)
        .increment('actual_hours', data.durationMinutes / 60);
    }

    return entry;
  }

  /**
   * Get project time summary
   * @param {string} projectId - Project ID
   */
  static async getProjectTimeSummary(projectId) {
    const summary = await db('task_time_entries')
      .join('tasks', 'task_time_entries.task_id', 'tasks.id')
      .where('tasks.project_id', projectId)
      .select(
        db.raw('SUM(task_time_entries.duration_minutes) / 60.0 as total_hours'),
        db.raw('SUM(CASE WHEN task_time_entries.billable THEN task_time_entries.duration_minutes ELSE 0 END) / 60.0 as billable_hours'),
        db.raw('COUNT(DISTINCT task_time_entries.employee_id) as contributor_count')
      )
      .first();

    return {
      totalHours: parseFloat(summary.total_hours) || 0,
      billableHours: parseFloat(summary.billable_hours) || 0,
      contributorCount: parseInt(summary.contributor_count) || 0
    };
  }

  // ==================== GANTT CHART DATA ====================

  /**
   * Get Gantt chart data for project
   * @param {string} projectId - Project ID
   */
  static async getGanttData(projectId) {
    const [project, milestones, tasks] = await Promise.all([
      this.findById(projectId),
      this.getMilestones(projectId),
      this.getTasks(projectId)
    ]);

    // Format for Gantt chart
    const ganttItems = [
      // Project itself
      {
        id: project.id,
        name: project.name,
        type: 'project',
        start: project.startDate,
        end: project.endDate,
        progress: project.progressPercentage,
        dependencies: []
      },
      // Milestones
      ...milestones.map(m => ({
        id: m.id,
        name: m.name,
        type: 'milestone',
        start: m.dueDate,
        end: m.dueDate,
        progress: m.status === 'completed' ? 100 : 0,
        dependencies: m.dependencies || [],
        status: m.status
      })),
      // Tasks
      ...tasks.map(t => ({
        id: t.id,
        name: t.title,
        type: 'task',
        start: t.startDate,
        end: t.dueDate,
        progress: this.calculateTaskProgress(t),
        dependencies: t.dependencies || [],
        assignee: t.assigneeName,
        status: t.status,
        milestoneId: t.milestoneId
      }))
    ];

    return {
      project,
      items: ganttItems
    };
  }

  /**
   * Calculate task progress
   * @param {Object} task - Task object
   */
  static calculateTaskProgress(task) {
    if (task.status === 'completed') return 100;
    if (task.status === 'cancelled') return 0;
    if (!task.actualHours || !task.estimatedHours) {
      return task.status === 'in_progress' ? 50 : 0;
    }
    return Math.min(100, Math.round((task.actualHours / task.estimatedHours) * 100));
  }

  // ==================== FORMATTERS ====================

  static formatProject(project) {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      clientId: project.client_id,
      clientName: project.client_name,
      companyId: project.company_id,
      companyName: project.company_name,
      status: project.status,
      priority: project.priority,
      type: project.type,
      budget: project.budget,
      actualCost: project.actual_cost,
      startDate: project.start_date,
      endDate: project.end_date,
      actualStartDate: project.actual_start_date,
      actualEndDate: project.actual_end_date,
      projectManagerId: project.project_manager_id,
      projectManagerName: project.project_manager_name,
      progressPercentage: project.progress_percentage,
      notes: project.notes,
      bookingId: project.booking_id,
      bookingNumber: project.booking_number,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    };
  }

  static formatMilestone(milestone) {
    return {
      id: milestone.id,
      projectId: milestone.project_id,
      name: milestone.name,
      description: milestone.description,
      dueDate: milestone.due_date,
      completedDate: milestone.completed_date,
      status: milestone.status,
      dependencies: milestone.dependencies ? JSON.parse(milestone.dependencies) : [],
      deliverables: milestone.deliverables ? JSON.parse(milestone.deliverables) : [],
      orderIndex: milestone.order_index,
      createdAt: milestone.created_at,
      updatedAt: milestone.updated_at
    };
  }

  static formatTask(task) {
    return {
      id: task.id,
      projectId: task.project_id,
      milestoneId: task.milestone_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assignee_id,
      assigneeName: task.assignee_name,
      createdBy: task.created_by,
      createdByName: task.created_by_name,
      startDate: task.start_date,
      dueDate: task.due_date,
      completedDate: task.completed_date,
      estimatedHours: task.estimated_hours,
      actualHours: task.actual_hours,
      dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
      parentTaskId: task.parent_task_id,
      position: task.position,
      tags: task.tags,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };
  }
}

module.exports = ProjectModel;
