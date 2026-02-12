const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class Milestone extends Model {
  static get tableName() {
    return 'milestones';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['project_id', 'name', 'due_date'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        project_id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: ['string', 'null'] },
        due_date: { type: 'string', format: 'date' },
        completed_date: { type: ['string', 'null'], format: 'date' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'delayed'] },
        dependencies: { type: 'array', items: { type: 'string', format: 'uuid' } },
        deliverables: { type: 'array', items: { type: 'object' } },
        order_index: { type: 'integer' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Project = require('./Project');
    const Task = require('./Task');

    return {
      project: {
        relation: Model.BelongsToOneRelation,
        modelClass: Project,
        join: {
          from: 'milestones.project_id',
          to: 'projects.id'
        }
      },
      tasks: {
        relation: Model.HasManyRelation,
        modelClass: Task,
        join: {
          from: 'milestones.id',
          to: 'tasks.milestone_id'
        }
      }
    };
  }

  // Check if milestone is delayed
  isDelayed() {
    if (this.status === 'completed') return false;
    const today = new Date();
    const dueDate = new Date(this.due_date);
    return today > dueDate;
  }

  // Update status based on tasks
  async updateStatusFromTasks() {
    const tasks = await this.$relatedQuery('tasks');
    if (tasks.length === 0) return this.status;

    const allCompleted = tasks.every(t => t.status === 'completed');
    const someInProgress = tasks.some(t => t.status === 'in_progress');
    const someCompleted = tasks.some(t => t.status === 'completed');

    let newStatus = 'pending';
    if (allCompleted) {
      newStatus = 'completed';
      if (!this.completed_date) {
        await this.$query().patch({ 
          status: newStatus, 
          completed_date: new Date().toISOString().split('T')[0] 
        });
        return newStatus;
      }
    } else if (someInProgress || someCompleted) {
      newStatus = 'in_progress';
    }

    if (this.isDelayed() && newStatus !== 'completed') {
      newStatus = 'delayed';
    }

    if (newStatus !== this.status) {
      await this.$query().patch({ status: newStatus });
    }

    return newStatus;
  }

  // Get deliverables completion percentage
  getDeliverablesProgress() {
    if (!this.deliverables || this.deliverables.length === 0) return 0;
    const completed = this.deliverables.filter(d => d.completed).length;
    return Math.round((completed / this.deliverables.length) * 100);
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = Milestone;