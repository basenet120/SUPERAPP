const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class TaskComment extends Model {
  static get tableName() {
    return 'task_comments';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['task_id', 'user_id', 'content'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        task_id: { type: 'string', format: 'uuid' },
        user_id: { type: 'string', format: 'uuid' },
        content: { type: 'string', minLength: 1 },
        type: { type: 'string', enum: ['comment', 'status_change', 'assignment', 'time_logged'] },
        metadata: { type: 'object' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Task = require('./Task');
    const User = require('./User');

    return {
      task: {
        relation: Model.BelongsToOneRelation,
        modelClass: Task,
        join: {
          from: 'task_comments.task_id',
          to: 'tasks.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'task_comments.user_id',
          to: 'users.id'
        }
      }
    };
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = TaskComment;