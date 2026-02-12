const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class Task extends Model {
  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['project_id', 'title'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        project_id: { type: 'string', format: 'uuid' },
        milestone_id: { type: ['string', 'null'], format: 'uuid' },
        title: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: ['string', 'null'] },
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'completed', 'cancelled'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        assignee_id: { type: ['string', 'null'], format: 'uuid' },
        created_by: { type: ['string', 'null'], format: 'uuid' },
        start_date: { type: ['string', 'null'], format: 'date' },
        due_date: { type: ['string', 'null'], format: 'date' },
        completed_date: { type: ['string', 'null'], format: 'date' },
        estimated_hours: { type: ['integer', 'null'] },
        actual_hours: { type: ['integer', 'null'] },
        dependencies: { type: 'array', items: { type: 'string', format: 'uuid' } },
        parent_task_id: { type: ['string', 'null'], format: 'uuid' },
        position: { type: 'integer' },
        tags: { type: ['string', 'null'] },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Project = require('./Project');
    const Milestone = require('./Milestone');
    const Employee = require('./Employee');
    const User = require('./User');
    const TaskComment = require('./TaskComment');
    const TaskTimeEntry = require('./TaskTimeEntry');

    return {
      project: {
        relation: Model.BelongsToOneRelation,
        modelClass: Project,
        join: {
          from: 'tasks.project_id',
          to: 'projects.id'
        }
      },
      milestone: {
        relation: Model.BelongsToOneRelation,
        modelClass: Milestone,
        join: {
          from: 'tasks.milestone_id',
          to: 'milestones.id'
        }
      },
      assignee: {
        relation: Model.BelongsToOneRelation,
        modelClass: Employee,
        join: {
          from: 'tasks.assignee_id',
          to: 'employee_profiles.id'
        }
      },
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.created_by',
          to: 'users.id'
        }
      },
      comments: {
        relation: Model.HasManyRelation,
        modelClass: TaskComment,
        join: {
          from: 'tasks.id',
          to: 'task_comments.task_id'
        }
      },
      timeEntries: {
        relation: Model.HasManyRelation,
        modelClass: TaskTimeEntry,
        join: {
          from: 'tasks.id',
          to: 'task_time_entries.task_id'
        }
      },
      parentTask: {
        relation: Model.BelongsToOneRelation,
        modelClass: Task,
        join: {
          from: 'tasks.parent_task_id',
          to: 'tasks.id'
        }
      },
      subtasks: {
        relation: Model.HasManyRelation,
        modelClass: Task,
        join: {
          from: 'tasks.id',
          to: 'tasks.parent_task_id'
        }
      }
    };
  }

  // Check if task is overdue
  isOverdue() {
    if (this.status === 'completed' || this.status === 'cancelled') return false;
    if (!this.due_date) return false;
    const today = new Date();
    const dueDate = new Date(this.due_date);
    return today > dueDate;
  }

  // Get total logged hours
  async getTotalHours() {
    const entries = await this.$relatedQuery('timeEntries');
    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    return Math.round(totalMinutes / 60 * 100) / 100;
  }

  // Start time tracking
  async startTimer(employeeId) {
    const TaskTimeEntry = require('./TaskTimeEntry');
    
    // Check if there's already an active timer
    const activeEntry = await TaskTimeEntry.query()
      .where({
        task_id: this.id,
        employee_id: employeeId
      })
      .whereNull('ended_at')
      .first();

    if (activeEntry) {
      throw new Error('Timer already running for this task');
    }

    return await TaskTimeEntry.query().insert({
      task_id: this.id,
      employee_id: employeeId,
      started_at: new Date().toISOString(),
      billable: true
    });
  }

  // Stop time tracking
  async stopTimer(employeeId) {
    const TaskTimeEntry = require('./TaskTimeEntry');
    
    const activeEntry = await TaskTimeEntry.query()
      .where({
        task_id: this.id,
        employee_id: employeeId
      })
      .whereNull('ended_at')
      .first();

    if (!activeEntry) {
      throw new Error('No active timer found for this task');
    }

    const endedAt = new Date();
    const startedAt = new Date(activeEntry.started_at);
    const durationMinutes = Math.round((endedAt - startedAt) / (1000 * 60));

    await TaskTimeEntry.query()
      .findById(activeEntry.id)
      .patch({
        ended_at: endedAt.toISOString(),
        duration_minutes: durationMinutes
      });

    // Update actual hours on task
    const totalHours = await this.getTotalHours();
    await this.$query().patch({ actual_hours: Math.round(totalHours) });

    return { durationMinutes, totalHours };
  }

  // Check if dependencies are completed
  async areDependenciesMet() {
    if (!this.dependencies || this.dependencies.length === 0) return true;
    
    const dependencies = await Task.query()
      .whereIn('id', this.dependencies)
      .select('status');
    
    return dependencies.every(d => d.status === 'completed');
  }

  // Complete task
  async complete(userId) {
    const dependenciesMet = await this.areDependenciesMet();
    if (!dependenciesMet) {
      throw new Error('Cannot complete task: dependencies not met');
    }

    await this.$query().patch({
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
      progress_percentage: 100
    });

    // Add completion comment
    const TaskComment = require('./TaskComment');
    await TaskComment.query().insert({
      task_id: this.id,
      user_id: userId,
      content: 'Task completed',
      type: 'status_change',
      metadata: { new_status: 'completed' }
    });

    // Update project progress
    const Project = require('./Project');
    const project = await Project.query().findById(this.project_id);
    if (project) {
      await project.updateProgress();
    }

    // Update milestone status
    if (this.milestone_id) {
      const Milestone = require('./Milestone');
      const milestone = await Milestone.query().findById(this.milestone_id);
      if (milestone) {
        await milestone.updateStatusFromTasks();
      }
    }

    return this;
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = Task;