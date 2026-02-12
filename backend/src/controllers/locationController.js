const Location = require('../models/Location');
const EquipmentLocation = require('../models/EquipmentLocation');
const logger = require('../utils/logger');

class LocationController {
  // Get all locations
  async getLocations(req, res, next) {
    try {
      const { type, city, is_active, include_inventory } = req.query;

      let query = Location.query()
        .withGraphFetched('[manager]');

      if (type) query = query.where('type', type);
      if (city) query = query.where('city', 'ilike', `%${city}%`);
      if (is_active !== undefined) query = query.where('is_active', is_active === 'true');

      const locations = await query.orderBy('name');

      // Include equipment inventory if requested
      if (include_inventory === 'true') {
        for (const location of locations) {
          location.inventory = await EquipmentLocation.query()
            .where('location_id', location.id)
            .withGraphFetched('equipment')
            .where('quantity', '>', 0);
        }
      }

      res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      logger.error('Error fetching locations:', error);
      next(error);
    }
  }

  // Get single location
  async getLocation(req, res, next) {
    try {
      const { id } = req.params;

      const location = await Location.query()
        .findById(id)
        .withGraphFetched('[manager, equipment.equipment]');

      if (!location) {
        return res.status(404).json({
          success: false,
          error: { message: 'Location not found' }
        });
      }

      res.json({
        success: true,
        data: location
      });
    } catch (error) {
      logger.error('Error fetching location:', error);
      next(error);
    }
  }

  // Create location
  async createLocation(req, res, next) {
    try {
      const locationData = req.body;

      const location = await Location.query().insert(locationData);

      logger.info(`Location created: ${location.id} by ${req.user.id}`);

      res.status(201).json({
        success: true,
        data: location
      });
    } catch (error) {
      logger.error('Error creating location:', error);
      next(error);
    }
  }

  // Update location
  async updateLocation(req, res, next) {
    try {
      const { id } = req.params;

      const location = await Location.query().findById(id);
      if (!location) {
        return res.status(404).json({
          success: false,
          error: { message: 'Location not found' }
        });
      }

      const updated = await Location.query()
        .findById(id)
        .patch(req.body)
        .returning('*');

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      logger.error('Error updating location:', error);
      next(error);
    }
  }

  // Delete location
  async deleteLocation(req, res, next) {
    try {
      const { id } = req.params;

      await Location.query().deleteById(id);

      res.json({
        success: true,
        message: 'Location deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting location:', error);
      next(error);
    }
  }

  // Add equipment to location
  async addEquipment(req, res, next) {
    try {
      const { id } = req.params;
      const { equipment_id, quantity, storage_location } = req.body;

      const existing = await EquipmentLocation.query()
        .where({ location_id: id, equipment_id })
        .first();

      if (existing) {
        // Update existing
        const updated = await EquipmentLocation.query()
          .findById(existing.id)
          .patch({
            quantity: existing.quantity + quantity,
            quantity_available: existing.quantity_available + quantity,
            storage_location: storage_location || existing.storage_location
          })
          .returning('*');

        return res.json({
          success: true,
          data: updated
        });
      }

      // Create new
      const equipmentLocation = await EquipmentLocation.query().insert({
        location_id: id,
        equipment_id,
        quantity,
        quantity_available: quantity,
        storage_location
      });

      res.status(201).json({
        success: true,
        data: equipmentLocation
      });
    } catch (error) {
      logger.error('Error adding equipment to location:', error);
      next(error);
    }
  }

  // Update equipment quantity at location
  async updateEquipmentQuantity(req, res, next) {
    try {
      const { id, equipmentId } = req.params;
      const { quantity, quantity_available, status } = req.body;

      const equipmentLocation = await EquipmentLocation.query()
        .where({ location_id: id, equipment_id: equipmentId })
        .first();

      if (!equipmentLocation) {
        return res.status(404).json({
          success: false,
          error: { message: 'Equipment not found at this location' }
        });
      }

      const updated = await EquipmentLocation.query()
        .findById(equipmentLocation.id)
        .patch({
          quantity: quantity !== undefined ? quantity : equipmentLocation.quantity,
          quantity_available: quantity_available !== undefined ? quantity_available : equipmentLocation.quantity_available,
          status: status || equipmentLocation.status
        })
        .returning('*');

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      logger.error('Error updating equipment quantity:', error);
      next(error);
    }
  }

  // Create transfer request
  async createTransfer(req, res, next) {
    try {
      const transferData = {
        ...req.body,
        requested_by: req.user.id,
        status: 'pending'
      };

      const transfer = await knex('location_transfers').insert(transferData).returning('*');

      logger.info(`Transfer requested: ${transfer[0].id}`);

      res.status(201).json({
        success: true,
        data: transfer[0]
      });
    } catch (error) {
      logger.error('Error creating transfer:', error);
      next(error);
    }
  }

  // Get transfers
  async getTransfers(req, res, next) {
    try {
      const { status, location_id } = req.query;

      let query = knex('location_transfers')
        .select('*')
        .orderBy('created_at', 'desc');

      if (status) query = query.where('status', status);
      if (location_id) {
        query = query.where(builder => {
          builder.where('from_location_id', location_id)
            .orWhere('to_location_id', location_id);
        });
      }

      const transfers = await query;

      res.json({
        success: true,
        data: transfers
      });
    } catch (error) {
      logger.error('Error fetching transfers:', error);
      next(error);
    }
  }

  // Update transfer status
  async updateTransfer(req, res, next) {
    try {
      const { transferId } = req.params;
      const { status, tracking_number } = req.body;

      const updateData = { status };
      
      if (status === 'in_transit') {
        updateData.shipped_at = new Date().toISOString();
        updateData.tracking_number = tracking_number;
      } else if (status === 'completed') {
        updateData.received_at = new Date().toISOString();
      }

      const transfer = await knex('location_transfers')
        .where('id', transferId)
        .update(updateData)
        .returning('*');

      res.json({
        success: true,
        data: transfer[0]
      });
    } catch (error) {
      logger.error('Error updating transfer:', error);
      next(error);
    }
  }

  // Get user location access
  async getUserLocations(req, res, next) {
    try {
      const userId = req.params.userId || req.user.id;

      const locations = await knex('user_location_access')
        .where('user_id', userId)
        .join('locations', 'user_location_access.location_id', 'locations.id')
        .select('locations.*', 'user_location_access.access_level', 'user_location_access.is_default');

      res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      logger.error('Error fetching user locations:', error);
      next(error);
    }
  }

  // Grant user location access
  async grantAccess(req, res, next) {
    try {
      const { userId, locationId } = req.params;
      const { access_level = 'view', is_default = false } = req.body;

      const existing = await knex('user_location_access')
        .where({ user_id: userId, location_id: locationId })
        .first();

      if (existing) {
        await knex('user_location_access')
          .where({ user_id: userId, location_id: locationId })
          .update({ access_level, is_default });
      } else {
        await knex('user_location_access').insert({
          user_id: userId,
          location_id: locationId,
          access_level,
          is_default
        });
      }

      res.json({
        success: true,
        message: 'Access granted successfully'
      });
    } catch (error) {
      logger.error('Error granting location access:', error);
      next(error);
    }
  }
}

module.exports = new LocationController();