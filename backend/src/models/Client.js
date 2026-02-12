const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class Client extends Model {
  static get tableName() {
    return 'clients';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        company_name: { type: 'string' },
        contact_name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        tier: { type: 'string' },
        status: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Company = require('./Company');
    const Project = require('./Project');
    const Document = require('./Document');

    return {
      company: {
        relation: Model.BelongsToOneRelation,
        modelClass: Company,
        join: {
          from: 'clients.company_id',
          to: 'companies.id'
        }
      },
      projects: {
        relation: Model.HasManyRelation,
        modelClass: Project,
        join: {
          from: 'clients.id',
          to: 'projects.client_id'
        }
      },
      documents: {
        relation: Model.HasManyRelation,
        modelClass: Document,
        join: {
          from: 'clients.id',
          to: 'documents.client_id'
        }
      }
    };
  }
}

module.exports = Client;