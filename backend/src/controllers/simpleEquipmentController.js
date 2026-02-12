const db = require('../config/database');

/**
 * Simple equipment controller for KM Rental data
 */
class SimpleEquipmentController {
  async list(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        category,
        type,
        search 
      } = req.query;

      let query = db('equipment').orderBy('name', 'asc');

      if (category) {
        query.where('category', category);
      }

      if (type) {
        query.where('type', type);
      }

      if (search) {
        query.where(builder => {
          builder
            .where('name', 'ilike', `%${search}%`)
            .orWhere('sku', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`);
        });
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const [countResult, rows] = await Promise.all([
        db('equipment').count('* as count').first(),
        query.limit(parseInt(limit)).offset(offset)
      ]);

      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.count),
          pages: Math.ceil(countResult.count / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const equipment = await db('equipment').where('id', id).first();

      if (!equipment) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Equipment not found' }
        });
      }

      res.json({
        success: true,
        data: equipment
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await db('equipment')
        .distinct('category')
        .orderBy('category', 'asc')
        .pluck('category');

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SimpleEquipmentController();
