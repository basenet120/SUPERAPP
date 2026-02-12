const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class Company extends Model {
  static get tableName() {
    return 'companies';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        industry: { type: 'string' },
        website: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        address: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        postal_code: { type: 'string' },
        country: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Client = require('./Client');
    const Project = require('./Project');
    const Document = require('./Document');

    return {
      clients: {
        relation: Model.HasManyRelation,
        modelClass: Client,
        join: {
          from: 'companies.id',
          to: 'clients.company_id'
        }
      },
      projects: {
        relation: Model.HasManyRelation,
        modelClass: Project,
        join: {
          from: 'companies.id',
          to: 'projects.company_id'
        }
      },
      documents: {
        relation: Model.HasManyRelation,
        modelClass: Document,
        join: {
          from: 'companies.id',
          to: 'documents.company_id'
        }
      }
    };
  }
}

module.exports = Company;