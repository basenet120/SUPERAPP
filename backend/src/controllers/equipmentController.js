const EquipmentModel = require('../models/Equipment');
const { logAudit } = require('../utils/audit');
const { ValidationError, NotFoundError } = require('../utils/errors');
const db = require('../config/database');

class EquipmentController {
  /**
   * List equipment
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async list(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        categoryId, 
        vendorId, 
        status, 
        ownershipType,
        search 
      } = req.query;

      const result = await EquipmentModel.list(
        { categoryId, vendorId, status, ownershipType, search },
        { page: parseInt(page), limit: parseInt(limit) }
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get equipment by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const equipment = await EquipmentModel.findById(id);

      if (!equipment) {
        throw new NotFoundError('Equipment');
      }

      res.json({
        success: true,
        data: equipment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create equipment
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async create(req, res, next) {
    try {
      const equipment = await EquipmentModel.create(req.body);

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'create',
        resource: 'equipment',
        resourceId: equipment.id,
        newValues: req.body,
        req
      });

      res.status(201).json({
        success: true,
        data: equipment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update equipment
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      
      const oldEquipment = await EquipmentModel.findById(id);
      if (!oldEquipment) {
        throw new NotFoundError('Equipment');
      }

      const equipment = await EquipmentModel.update(id, req.body);

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'update',
        resource: 'equipment',
        resourceId: id,
        oldValues: oldEquipment,
        newValues: equipment,
        req
      });

      res.json({
        success: true,
        data: equipment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete equipment
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await EquipmentModel.delete(id);

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'delete',
        resource: 'equipment',
        resourceId: id,
        req
      });

      res.json({
        success: true,
        message: 'Equipment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check equipment availability
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async checkAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError('Start date and end date are required');
      }

      const isAvailable = await EquipmentModel.checkAvailability(
        id,
        new Date(startDate),
        new Date(endDate)
      );

      const calendar = await EquipmentModel.getAvailabilityCalendar(
        id,
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: {
          isAvailable,
          conflicts: calendar
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get equipment categories
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getCategories(req, res, next) {
    try {
      const categories = await db('equipment_categories')
        .whereNull('deleted_at')
        .orderBy('sort_order');

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create category
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async createCategory(req, res, next) {
    try {
      const { name, slug, description, parentId } = req.body;

      const [category] = await db('equipment_categories')
        .insert({ name, slug, description, parent_id: parentId })
        .returning('*');

      res.status(201).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get vendors
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getVendors(req, res, next) {
    try {
      const vendors = await db('vendors')
        .whereNull('deleted_at')
        .orderBy('name');

      res.json({
        success: true,
        data: vendors
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create vendor
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async createVendor(req, res, next) {
    try {
      const { name, slug, type, description, markupPercentage } = req.body;

      const [vendor] = await db('vendors')
        .insert({ 
          name, 
          slug, 
          type, 
          description, 
          markup_percentage: markupPercentage 
        })
        .returning('*');

      res.status(201).json({
        success: true,
        data: vendor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Import equipment from CSV data
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async bulkImport(req, res, next) {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        throw new ValidationError('Items array is required');
      }

      const results = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const item of items) {
        try {
          // Check if exists by SKU
          if (item.sku) {
            const existing = await db('equipment').where({ sku: item.sku }).first();
            if (existing) {
              await EquipmentModel.update(existing.id, item);
              results.updated++;
              continue;
            }
          }

          await EquipmentModel.create(item);
          results.created++;
        } catch (err) {
          results.errors.push({ item, error: err.message });
        }
      }

      // Log audit
      await logAudit({
        userId: req.user.id,
        action: 'bulk_import',
        resource: 'equipment',
        newValues: results,
        req
      });

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EquipmentController();
