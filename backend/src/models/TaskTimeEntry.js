const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class TaskTimeEntry extends Model {
  static get tableName() {
    return 'task_time_entries';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['task_id', 'employee_id', 'started_at'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        task_id: { type: 'string', format: 'uuid' },
        employee_id: { type: 'string', format: 'uuid' },
        started_at: { type: 'string', format: 'date-time' },
        ended_at: { type: ['string', 'null'], format: 'date-time' },
        duration_minutes: { type: ['integer', 'null'] },
        description: { type: ['string', 'null'] },
        billable: { type: 'boolean', default: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Task = require('./Task');
    const Employee = require('./Employee');

    return {
      task: {
        relation: Model.BelongsToOneRelation,
        modelClass: Task,
        join: {
          from: 'task_time_entries.task_id',
          to: 'tasks.id'
        }
      },
      employee: {
        relation: Model.BelongsToOneRelation,
        modelClass: Employee,
        join: {
          from: 'task_time_entries.employee_id',
          to: 'employee_profiles.id'
        }
      }
    };
  }

  // Get duration in hours
  getDurationHours() {
    if (this.duration_minutes) {
      return Math.round(this.duration_minutes / 60 * 100) / 100;
    }
    if (this.ended_at && this.started_at) {
      const start = new Date(this.started_at);
      const end = new Date(this.ended_at);
      const minutes = (end - start) / (1000 * 60);
      return Math.round(minutes / 60 * 100) / 100;
    }
    return 0;
  }

  // Check if timer is running
  isRunning() {
    return !this.ended_at;
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = TaskTimeEntry;