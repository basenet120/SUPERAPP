const InventoryAlertModel = require('../models/InventoryAlert');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Inventory Alert Controller
 * Handles inventory alerts and monitoring
 */
class InventoryAlertController {
  /**
   * Get all alerts
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getAlerts(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status = 'active',
        type,
        severity,
        equipmentId
      } = req.query;

      const result = await InventoryAlertModel.list(
        { status, type, severity, equipmentId },
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
   * Get alert by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getAlert(req, res, next) {
    try {
      const { id } = req.params;
      
      const alert = await InventoryAlertModel.findById(id);
      if (!alert) {
        throw new NotFoundError('Alert');
      }

      res.json({
        success: true,
        data: alert
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active alerts summary
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getSummary(req, res, next) {
    try {
      const summary = await InventoryAlertModel.getActiveSummary();

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Acknowledge alert
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async acknowledgeAlert(req, res, next) {
    try {
      const { id } = req.params;
      
      const alert = await InventoryAlertModel.acknowledge(id, req.user.id);

      res.json({
        success: true,
        data: alert
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve alert
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async resolveAlert(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      const alert = await InventoryAlertModel.resolve(id, req.user.id, notes);

      res.json({
        success: true,
        data: alert
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ignore alert
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async ignoreAlert(req, res, next) {
    try {
      const { id } = req.params;
      
      const alert = await InventoryAlertModel.ignore(id, req.user.id);

      res.json({
        success: true,
        data: alert
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Run alert checks
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async runChecks(req, res, next) {
    try {
      const results = {
        overdueReturns: [],
        maintenanceDue: [],
        lowStock: []
      };

      // Run checks in parallel
      const [overdue, maintenance, stock] = await Promise.all([
        InventoryAlertModel.checkOverdueReturns(),
        InventoryAlertModel.checkMaintenanceDue(),
        InventoryAlertModel.checkLowStock()
      ]);

      results.overdueReturns = overdue;
      results.maintenanceDue = maintenance;
      results.lowStock = stock;

      res.json({
        success: true,
        data: results,
        totalAlerts: overdue.length + maintenance.length + stock.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get condition history for equipment
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getConditionHistory(req, res, next) {
    try {
      const { equipmentId } = req.params;
      
      const history = await InventoryAlertModel.getConditionHistory(equipmentId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record condition change
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async recordConditionChange(req, res, next) {
    try {
      const {
        equipmentId,
        oldCondition,
        newCondition,
        reason,
        notes,
        photos,
        bookingId
      } = req.body;

      if (!equipmentId || !oldCondition || !newCondition) {
        throw new ValidationError('Equipment ID, old condition, and new condition are required');
      }

      const record = await InventoryAlertModel.recordConditionChange({
        equipmentId,
        oldCondition,
        newCondition,
        reason,
        notes,
        photos,
        changedBy: req.user.id,
        bookingId
      });

      res.status(201).json({
        success: true,
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stock levels
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getStockLevels(req, res, next) {
    try {
      const { equipmentId } = req.params;
      
      const levels = await InventoryAlertModel.getStockLevels(equipmentId);

      res.json({
        success: true,
        data: levels
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update stock levels
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async updateStockLevels(req, res, next) {
    try {
      const { equipmentId } = req.params;
      
      const levels = await InventoryAlertModel.updateStockLevels(equipmentId, req.body);

      res.json({
        success: true,
        data: levels
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryAlertController();
