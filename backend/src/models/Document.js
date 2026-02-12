const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class Document extends Model {
  static get tableName() {
    return 'documents';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'original_name', 'file_path', 'file_url', 'mime_type', 'file_size'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1 },
        original_name: { type: 'string', minLength: 1 },
        description: { type: ['string', 'null'] },
        file_path: { type: 'string' },
        file_url: { type: 'string' },
        mime_type: { type: 'string' },
        file_size: { type: 'integer' },
        checksum: { type: ['string', 'null'] },
        type: { type: 'string', enum: ['contract', 'coi', 'quote', 'invoice', 'proposal', 'receipt', 'permit', 'release_form', 'script', 'storyboard', 'call_sheet', 'other'] },
        category: { type: ['string', 'null'] },
        tags: { type: ['string', 'null'] },
        uploaded_by: { type: ['string', 'null'], format: 'uuid' },
        client_id: { type: ['string', 'null'], format: 'uuid' },
        company_id: { type: ['string', 'null'], format: 'uuid' },
        project_id: { type: ['string', 'null'], format: 'uuid' },
        booking_id: { type: ['string', 'null'], format: 'uuid' },
        status: { type: 'string', enum: ['active', 'archived', 'expired', 'pending_review'] },
        visibility: { type: 'string', enum: ['private', 'internal', 'client', 'public'] },
        version: { type: 'integer' },
        parent_document_id: { type: ['string', 'null'], format: 'uuid' },
        is_latest_version: { type: 'boolean' },
        effective_date: { type: ['string', 'null'], format: 'date' },
        expiration_date: { type: ['string', 'null'], format: 'date' },
        ocr_text: { type: ['string', 'null'] },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const User = require('./User');
    const Client = require('./Client');
    const Company = require('./Company');
    const Project = require('./Project');
    const Booking = require('./Booking');

    return {
      uploader: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'documents.uploaded_by',
          to: 'users.id'
        }
      },
      client: {
        relation: Model.BelongsToOneRelation,
        modelClass: Client,
        join: {
          from: 'documents.client_id',
          to: 'clients.id'
        }
      },
      company: {
        relation: Model.BelongsToOneRelation,
        modelClass: Company,
        join: {
          from: 'documents.company_id',
          to: 'companies.id'
        }
      },
      project: {
        relation: Model.BelongsToOneRelation,
        modelClass: Project,
        join: {
          from: 'documents.project_id',
          to: 'projects.id'
        }
      },
      booking: {
        relation: Model.BelongsToOneRelation,
        modelClass: Booking,
        join: {
          from: 'documents.booking_id',
          to: 'bookings.id'
        }
      }
    };
  }

  // Check if document is expired
  isExpired() {
    if (!this.expiration_date) return false;
    const today = new Date();
    const expiry = new Date(this.expiration_date);
    return today > expiry;
  }

  // Get file extension
  getExtension() {
    return this.original_name.split('.').pop().toLowerCase();
  }

  // Check if document is PDF
  isPDF() {
    return this.mime_type === 'application/pdf' || this.getExtension() === 'pdf';
  }

  // Check if document is image
  isImage() {
    return this.mime_type.startsWith('image/');
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = Document;