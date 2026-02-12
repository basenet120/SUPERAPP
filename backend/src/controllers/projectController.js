const ProjectModel = require('../models/Project');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Project Management Controller
 * Handles projects, milestones, tasks, and Gantt charts
 */
class ProjectController {
  /**
   * Create project
   */
  async createProject(req, res, next) {
    try {
      const { name, clientId, companyId, startDate, endDate } = req.body;

      if (!name) {
        throw new ValidationError('Project name is required');
      }

      if (!startDate || !endDate) {
        throw new ValidationError('Start and end dates are required');
      }

      const project = await ProjectModel.create({
        ...req.body,
        projectManagerId: req.body.projectManagerId || req.user.id
      });

      res.status(201).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project by ID
   */
  async getProject(req, res, next) {
    try {
      const { id } = req.params;
      
      const project = await ProjectModel.findById(id);
      if (!project) {
        throw new NotFoundError('Project');
      }

      // Get related data
      const [milestones, tasks, members, timeSummary] = await Promise.all([
        ProjectModel.getMilestones(id),
        ProjectModel.getTasks(id),
        ProjectModel.getProjectMembers(id),
        ProjectModel.getProjectTimeSummary(id)
      ]);

      res.json({
        success: true,
        data: {
          ...project,
          milestones,
          tasks,
          members,
          timeSummary
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update project
   */
  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      
      const project = await ProjectModel.update(id, req.body);

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete project
   */
  async deleteProject(req, res, next) {
    try {
      const { id } = req.params;
      
      await ProjectModel.delete(id);

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List projects
   */
  async listProjects(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status,
        priority,
        type,
        clientId,
        projectManagerId,
        search,
        dateFrom,
        dateTo
      } = req.query;

      const result = await ProjectModel.list(
        { status, priority, type, clientId, projectManagerId, search, dateFrom, dateTo },
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

  // ==================== MILESTONES ====================

  /**
   * Create milestone
   */
  async createMilestone(req, res, next) {
    try {
      const { projectId, name, dueDate } = req.body;

      if (!projectId || !name || !dueDate) {
        throw new ValidationError('Project ID, name, and due date are required');
      }

      const milestone = await ProjectModel.createMilestone(req.body);

      res.status(201).json({
        success: true,
        data: milestone
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project milestones
   */
  async getMilestones(req, res, next) {
    try {
      const { id } = req.params;
      
      const milestones = await ProjectModel.getMilestones(id);

      res.json({
        success: true,
        data: milestones
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update milestone
   */
  async updateMilestone(req, res, next) {
    try {
      const { milestoneId } = req.params;
      
      const milestone = await ProjectModel.updateMilestone(milestoneId, req.body);

      res.json({
        success: true,
        data: milestone
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete milestone
   */
  async deleteMilestone(req, res, next) {
    try {
      const { milestoneId } = req.params;
      
      await ProjectModel.deleteMilestone(milestoneId);

      res.json({
        success: true,
        message: 'Milestone deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== TASKS ====================

  /**
   * Create task
   */
  async createTask(req, res, next) {
    try {
      const { projectId, title } = req.body;

      if (!projectId || !title) {
        throw new ValidationError('Project ID and title are required');
      }

      const task = await ProjectModel.createTask({
        ...req.body,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project tasks
   */
  async getTasks(req, res, next) {
    try {
      const { id } = req.params;
      const { status, assigneeId, milestoneId } = req.query;
      
      const tasks = await ProjectModel.getTasks(id, { status, assigneeId, milestoneId });

      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get task by ID
   */
  async getTask(req, res, next) {
    try {
      const { taskId } = req.params;
      
      const task = await ProjectModel.getTaskById(taskId);
      if (!task) {
        throw new NotFoundError('Task');
      }

      // Get comments
      const comments = await ProjectModel.getTaskComments(taskId);

      res.json({
        success: true,
        data: { ...task, comments }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update task
   */
  async updateTask(req, res, next) {
    try {
      const { taskId } = req.params;
      
      const task = await ProjectModel.updateTask(taskId, req.body);

      // Log status change if applicable
      if (req.body.status && req.body.comment) {
        await ProjectModel.addTaskComment({
          taskId,
          userId: req.user.id,
          content: req.body.comment,
          type: 'status_change',
          metadata: { newStatus: req.body.status }
        });
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete task
   */
  async deleteTask(req, res, next) {
    try {
      const { taskId } = req.params;
      
      await ProjectModel.deleteTask(taskId);

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add task comment
   */
  async addTaskComment(req, res, next) {
    try {
      const { taskId } = req.params;
      const { content } = req.body;

      if (!content) {
        throw new ValidationError('Comment content is required');
      }

      const comment = await ProjectModel.addTaskComment({
        taskId,
        userId: req.user.id,
        content,
        type: req.body.type || 'comment',
        metadata: req.body.metadata
      });

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== PROJECT MEMBERS ====================

  /**
   * Add project member
   */
  async addProjectMember(req, res, next) {
    try {
      const { id } = req.params;
      const { employeeId, role, responsibilities } = req.body;

      if (!employeeId) {
        throw new ValidationError('Employee ID is required');
      }

      const member = await ProjectModel.addProjectMember({
        projectId: id,
        employeeId,
        role,
        responsibilities
      });

      res.status(201).json({
        success: true,
        data: member
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project members
   */
  async getProjectMembers(req, res, next) {
    try {
      const { id } = req.params;
      
      const members = await ProjectModel.getProjectMembers(id);

      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove project member
   */
  async removeProjectMember(req, res, next) {
    try {
      const { id, employeeId } = req.params;
      
      await ProjectModel.removeProjectMember(id, employeeId);

      res.json({
        success: true,
        message: 'Member removed from project'
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== TIME TRACKING ====================

  /**
   * Log time on task
   */
  async logTaskTime(req, res, next) {
    try {
      const { taskId } = req.params;
      const { durationMinutes, description, billable = true } = req.body;

      if (!durationMinutes) {
        throw new ValidationError('Duration is required');
      }

      const entry = await ProjectModel.logTaskTime({
        taskId,
        employeeId: req.body.employeeId,
        startedAt: req.body.startedAt || new Date(),
        endedAt: req.body.endedAt || new Date(),
        durationMinutes,
        description,
        billable
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
   * Get project time summary
   */
  async getProjectTimeSummary(req, res, next) {
    try {
      const { id } = req.params;
      
      const summary = await ProjectModel.getProjectTimeSummary(id);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== GANTT CHART ====================

  /**
   * Get Gantt chart data
   */
  async getGanttData(req, res, next) {
    try {
      const { id } = req.params;
      
      const ganttData = await ProjectModel.getGanttData(id);

      res.json({
        success: true,
        data: ganttData
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== KANBAN BOARD ====================

  /**
   * Get Kanban board data
   */
  async getKanbanBoard(req, res, next) {
    try {
      const { id } = req.params;
      
      const tasks = await ProjectModel.getTasks(id);

      // Group tasks by status
      const columns = {
        todo: tasks.filter(t => t.status === 'todo'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        review: tasks.filter(t => t.status === 'review'),
        completed: tasks.filter(t => t.status === 'completed')
      };

      res.json({
        success: true,
        data: {
          columns: [
            { id: 'todo', title: 'To Do', tasks: columns.todo },
            { id: 'in_progress', title: 'In Progress', tasks: columns.in_progress },
            { id: 'review', title: 'Review', tasks: columns.review },
            { id: 'completed', title: 'Completed', tasks: columns.completed }
          ]
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder Kanban tasks
   */
  async reorderKanbanTasks(req, res, next) {
    try {
      const { taskId } = req.params;
      const { status, position } = req.body;

      const updateData = { position };
      if (status) updateData.status = status;

      const task = await ProjectModel.updateTask(taskId, updateData);

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController();
