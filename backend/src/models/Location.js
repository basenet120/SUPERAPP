const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class Location extends Model {
  static get tableName() {
    return 'locations';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'address_line1', 'city', 'state', 'postal_code'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        code: { type: ['string', 'null'] },
        type: { type: 'string', enum: ['studio', 'warehouse', 'office', 'pickup_point', 'partner'] },
        address_line1: { type: 'string' },
        address_line2: { type: ['string', 'null'] },
        city: { type: 'string' },
        state: { type: 'string' },
        postal_code: { type: 'string' },
        country: { type: 'string' },
        latitude: { type: ['number', 'null'] },
        longitude: { type: ['number', 'null'] },
        phone: { type: ['string', 'null'] },
        email: { type: ['string', 'null'] },
        manager_name: { type: ['string', 'null'] },
        manager_id: { type: ['string', 'null'], format: 'uuid' },
        business_hours: { type: 'object' },
        special_hours: { type: ['string', 'null'] },
        is_active: { type: 'boolean' },
        is_primary: { type: 'boolean' },
        allows_pickup: { type: 'boolean' },
        allows_returns: { type: 'boolean' },
        pickup_instructions: { type: ['string', 'null'] },
        square_footage: { type: ['integer', 'null'] },
        parking_spaces: { type: ['integer', 'null'] },
        facilities: { type: ['string', 'null'] },
        access_instructions: { type: ['string', 'null'] },
        branding_logo_url: { type: ['string', 'null'] },
        branding_primary_color: { type: ['string', 'null'] },
        branding_secondary_color: { type: ['string', 'null'] },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const User = require('./User');
    const EquipmentLocation = require('./EquipmentLocation');

    return {
      manager: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'locations.manager_id',
          to: 'users.id'
        }
      },
      equipment: {
        relation: Model.HasManyRelation,
        modelClass: EquipmentLocation,
        join: {
          from: 'locations.id',
          to: 'equipment_locations.location_id'
        }
      }
    };
  }

  // Get full address
  getFullAddress() {
    return `${this.address_line1}${this.address_line2 ? ', ' + this.address_line2 : ''}, ${this.city}, ${this.state} ${this.postal_code}`;
  }

  // Check if location is open now
  isOpenNow() {
    if (!this.business_hours) return false;
    
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const hours = this.business_hours[day];
    
    if (!hours || hours.closed) return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    
    return currentTime >= openMinutes && currentTime < closeMinutes;
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = Location;