const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const Task = require('../models/Task');
const logger = require('../utils/logger');

// Project Management Controller
class ProjectManagementController {
  // Get all projects with filters
  async getProjects(req, res, next) {
    try {
      const {
        status,
        priority,
        type,
        client_id,
        project_manager_id,
        search,
        sort_by = 'created_at',
        sort_order = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      let query = Project.query()
        .withGraphFetched('[client, company, projectManager]')
        .page(parseInt(page) - 1, parseInt(limit));

      // Apply filters
      if (status) query = query.where('status', status);
      if (priority) query = query.where('priority', priority);
      if (type) query = query.where('type', type);
      if (client_id) query = query.where('client_id', client_id);
      if (project_manager_id) query = query.where('project_manager_id', project_manager_id);
      
      if (search) {
        query = query.where(builder => {
          builder.where('name', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`);
        });
      }

      // Apply sorting
      query = query.orderBy(sort_by, sort_order);

      const projects = await query;

      res.json({
        success: true,
        data: projects.results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: projects.total,
          totalPages: Math.ceil(projects.total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching projects:', error);
      next(error);
    }
  }

  // Get single project with all details
  async getProject(req, res, next) {
    try {
      const { id } = req.params;

      const project = await Project.query()
        .findById(id)
        .withGraphFetched('[client, company, projectManager, members.user, booking]');

      if (!project) {
        return res.status(404).json({
          success: false,
          error: { message: 'Project not found' }
        });
      }

      // Get statistics
      const statistics = await project.getStatistics();

      res.json({
        success: true,
        data: {
          ...project,
          statistics
        }
      });
    } catch (error) {
      logger.error('Error fetching project:', error);
      next(error);
    }
  }

  // Create new project
  async createProject(req, res, next) {
    try {
      const projectData = req.body;

      const project = await Project.query().insert(projectData);

      // Create initial milestone if provided
      if (req.body.initial_milestone) {
        await Milestone.query().insert({
          ...req.body.initial_milestone,
          project_id: project.id
        });
      }

      logger.info(`Project created: ${project.id} by ${req.user.id}`);

      res.status(201).json({
        success: true,
        data: project
      });
    } catch (error) {
      logger.error('Error creating project:', error);
      next(error);
    }
  }

  // Update project
  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const project = await Project.query().findById(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: { message: 'Project not found' }
        });
      }

      const updated = await Project.query()
        .findById(id)
        .patch(updateData)
        .returning('*');

      logger.info(`Project updated: ${id} by ${req.user.id}`);

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      logger.error('Error updating project:', error);
      next(error);
    }
  }

  // Delete project
  async deleteProject(req, res, next) {
    try {
      const { id } = req.params;

      const project = await Project.query().findById(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: { message: 'Project not found' }
        });
      }

      await Project.query().deleteById(id);

      logger.info(`Project deleted: ${id} by ${req.user.id}`);

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting project:', error);
      next(error);
    }
  }

  // Get Gantt chart data
  async getGanttData(req, res, next) {
    try {
      const { id } = req.params;

      const project = await Project.query().findById(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: { message: 'Project not found' }
        });
      }

      const ganttData = await project.getGanttData();

      res.json({
        success: true,
        data: ganttData
      });
    } catch (error) {
      logger.error('Error fetching Gantt data:', error);
      next(error);
    }
  }

  // ==================== MILESTONES ====================

  // Get project milestones
  async getMilestones(req, res, next) {
    try {
      const { projectId } = req.params;
      const { status } = req.query;

      let query = Milestone.query()
        .where('project_id', projectId)
        .withGraphFetched('tasks')
        .orderBy('order_index')
        .orderBy('due_date');

      if (status) {
        query = query.where('status', status);
      }

      const milestones = await query;

      res.json({
        success: true,
        data: milestones
      });
    } catch (error) {
      logger.error('Error fetching milestones:', error);
      next(error);
    }
  }

  // Create milestone
  async createMilestone(req, res, next) {
    try {
      const { projectId } = req.params;
      const milestoneData = {
        ...req.body,
        project_id: projectId
      };

      const milestone = await Milestone.query().insert(milestoneData);

      logger.info(`Milestone created: ${milestone.id} for project ${projectId}`);

      res.status(201).json({
        success: true,
        data: milestone
      });
    } catch (error) {
      logger.error('Error creating milestone:', error);
      next(error);
    }
  }

  // Update milestone
  async updateMilestone(req, res, next) {
    try {
      const { milestoneId } = req.params;

      const milestone = await Milestone.query().findById(milestoneId);
      if (!milestone) {
        return res.status(404).json({
          success: false,
          error: { message: 'Milestone not found' }
        });
      }

      const updated = await Milestone.query()
        .findById(milestoneId)
        .patch(req.body)
        .returning('*');

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      logger.error('Error updating milestone:', error);
      next(error);
    }
  }

  // Delete milestone
  async deleteMilestone(req, res, next) {
    try {
      const { milestoneId } = req.params;

      await Milestone.query().deleteById(milestoneId);

      res.json({
        success: true,
        message: 'Milestone deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting milestone:', error);
      next(error);
    }
  }

  // ==================== TASKS ====================

  // Get project tasks
  async getTasks(req, res, next) {
    try {
      const { projectId } = req.params;
      const { 
        status, 
        assignee_id, 
        milestone_id,
        priority,
        search,
        overdue_only
      } = req.query;

      let query = Task.query()
        .where('project_id', projectId)
        .withGraphFetched('[assignee, milestone, comments.user, timeEntries]')
        .orderBy('created_at', 'desc');

      if (status) query = query.where('status', status);
      if (assignee_id) query = query.where('assignee_id', assignee_id);
      if (milestone_id) query = query.where('milestone_id', milestone_id);
      if (priority) query = query.where('priority', priority);
      
      if (search) {
        query = query.where(builder => {
          builder.where('title', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`);
        });
      }

      if (overdue_only === 'true') {
        const today = new Date().toISOString().split('T')[0];
        query = query.where('due_date', '<', today)
          .whereNotIn('status', ['completed', 'cancelled']);
      }

      const tasks = await query;

      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      logger.error('Error fetching tasks:', error);
      next(error);
    }
  }

  // Create task
  async createTask(req, res, next) {
    try {
      const { projectId } = req.params;
      const taskData = {
        ...req.body,
        project_id: projectId,
        created_by: req.user.id
      };

      const task = await Task.query().insert(taskData);

      // Fetch with relations for response
      const taskWithRelations = await Task.query()
        .findById(task.id)
        .withGraphFetched('[assignee, milestone]');

      logger.info(`Task created: ${task.id} for project ${projectId}`);

      res.status(201).json({
        success: true,
        data: taskWithRelations
      });
    } catch (error) {
      logger.error('Error creating task:', error);
      next(error);
    }
  }

  // Update task
  async updateTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const updateData = req.body;

      const task = await Task.query().findById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: { message: 'Task not found' }
        });
      }

      const updated = await Task.query()
        .findById(taskId)
        .patch(updateData)
        .returning('*');

      // Update project progress if status changed
      if (updateData.status && updateData.status !== task.status) {
        const Project = require('../models/Project');
        const project = await Project.query().findById(task.project_id);
        if (project) {
          await project.updateProgress();
        }
      }

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      logger.error('Error updating task:', error);
      next(error);
    }
  }

  // Complete task
  async completeTask(req, res, next) {
    try {
      const { taskId } = req.params;

      const task = await Task.query().findById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: { message: 'Task not found' }
        });
      }

      await task.complete(req.user.id);

      res.json({
        success: true,
        message: 'Task completed successfully',
        data: await Task.query().findById(taskId)
      });
    } catch (error) {
      logger.error('Error completing task:', error);
      next(error);
    }
  }

  // Delete task
  async deleteTask(req, res, next) {
    try {
      const { taskId } = req.params;

      await Task.query().deleteById(taskId);

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting task:', error);
      next(error);
    }
  }

  // Start task timer
  async startTimer(req, res, next) {
    try {
      const { taskId } = req.params;
      const employeeId = req.user.employee_id;

      const task = await Task.query().findById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: { message: 'Task not found' }
        });
      }

      const entry = await task.startTimer(employeeId);

      res.json({
        success: true,
        data: entry,
        message: 'Timer started'
      });
    } catch (error) {
      logger.error('Error starting timer:', error);
      res.status(400).json({
        success: false,
        error: { message: error.message }
      });
    }
  }

  // Stop task timer
  async stopTimer(req, res, next) {
    try {
      const { taskId } = req.params;
      const employeeId = req.user.employee_id;

      const task = await Task.query().findById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: { message: 'Task not found' }
        });
      }

      const result = await task.stopTimer(employeeId);

      res.json({
        success: true,
        data: result,
        message: 'Timer stopped'
      });
    } catch (error) {
      logger.error('Error stopping timer:', error);
      res.status(400).json({
        success: false,
        error: { message: error.message }
      });
    }
  }

  // Add task comment
  async addComment(req, res, next) {
    try {
      const { taskId } = req.params;
      const { content, type = 'comment', metadata } = req.body;

      const TaskComment = require('../models/TaskComment');
      const comment = await TaskComment.query().insert({
        task_id: taskId,
        user_id: req.user.id,
        content,
        type,
        metadata
      });

      const commentWithUser = await TaskComment.query()
        .findById(comment.id)
        .withGraphFetched('user');

      res.status(201).json({
        success: true,
        data: commentWithUser
      });
    } catch (error) {
      logger.error('Error adding comment:', error);
      next(error);
    }
  }

  // Get dashboard stats
  async getDashboardStats(req, res, next) {
    try {
      const userId = req.user.id;
      const employeeId = req.user.employee_id;

      // Get my tasks
      const myTasks = await Task.query()
        .where('assignee_id', employeeId)
        .whereNotIn('status', ['completed', 'cancelled']);

      // Get overdue tasks
      const today = new Date().toISOString().split('T')[0];
      const overdueTasks = myTasks.filter(t => t.due_date && t.due_date < today);

      // Get projects I'm managing
      const myProjects = await Project.query()
        .where('project_manager_id', userId)
        .whereNot('status', 'completed');

      // Get active timers
      const TaskTimeEntry = require('../models/TaskTimeEntry');
      const activeTimers = await TaskTimeEntry.query()
        .where('employee_id', employeeId)
        .whereNull('ended_at')
        .withGraphFetched('task');

      res.json({
        success: true,
        data: {
          my_tasks: {
            total: myTasks.length,
            overdue: overdueTasks.length,
            due_today: myTasks.filter(t => t.due_date === today).length
          },
          my_projects: myProjects.length,
          active_timers: activeTimers,
          recent_activity: [] // TODO: Add activity tracking
        }
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      next(error);
    }
  }
}

module.exports = new ProjectManagementController();