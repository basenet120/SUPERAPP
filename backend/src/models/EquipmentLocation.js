const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class EquipmentLocation extends Model {
  static get tableName() {
    return 'equipment_locations';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['equipment_id', 'location_id'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        equipment_id: { type: 'string', format: 'uuid' },
        location_id: { type: 'string', format: 'uuid' },
        quantity: { type: 'integer' },
        quantity_available: { type: 'integer' },
        storage_location: { type: ['string', 'null'] },
        status: { type: 'string', enum: ['available', 'in_use', 'maintenance', 'transit'] },
        condition_notes: { type: ['string', 'null'] },
        last_inventory_date: { type: ['string', 'null'], format: 'date' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Equipment = require('./Equipment');
    const Location = require('./Location');

    return {
      equipment: {
        relation: Model.BelongsToOneRelation,
        modelClass: Equipment,
        join: {
          from: 'equipment_locations.equipment_id',
          to: 'equipment.id'
        }
      },
      location: {
        relation: Model.BelongsToOneRelation,
        modelClass: Location,
        join: {
          from: 'equipment_locations.location_id',
          to: 'locations.id'
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

module.exports = EquipmentLocation;