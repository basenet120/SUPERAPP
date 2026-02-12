const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');

/**
 * Inventory Alert Model
 * Manage inventory alerts for low stock, maintenance, overdue returns
 */
class InventoryAlertModel {
  /**
   * Create an alert
   * @param {Object} data - Alert data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    // Check for duplicate active alert
    const existing = await db('inventory_alerts')
      .where({
        type: data.type,
        equipment_id: data.equipmentId || null,
        booking_id: data.bookingId || null,
        status: 'active'
      })
      .first();

    if (existing) {
      // Update existing alert with new data
      const [updated] = await db('inventory_alerts')
        .where({ id: existing.id })
        .update({
          title: data.title,
          description: data.description,
          data: JSON.stringify(data.data || {}),
          severity: data.severity,
          updated_at: new Date()
        })
        .returning('*');

      return this.formatAlert(updated);
    }

    const [alert] = await db('inventory_alerts')
      .insert({
        rule_id: data.ruleId,
        type: data.type,
        equipment_id: data.equipmentId,
        booking_id: data.bookingId,
        maintenance_id: data.maintenanceId,
        title: data.title,
        description: data.description,
        data: JSON.stringify(data.data || {}),
        severity: data.severity || 'warning',
        status: 'active'
      })
      .returning('*');

    return this.findById(alert.id);
  }

  /**
   * Find alert by ID
   * @param {string} id - Alert ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const alert = await db('inventory_alerts')
      .leftJoin('equipment', 'inventory_alerts.equipment_id', 'equipment.id')
      .leftJoin('bookings', 'inventory_alerts.booking_id', 'bookings.id')
      .leftJoin('users as ack', 'inventory_alerts.acknowledged_by', 'ack.id')
      .leftJoin('users as res', 'inventory_alerts.resolved_by', 'res.id')
      .where('inventory_alerts.id', id)
      .select(
        'inventory_alerts.*',
        'equipment.name as equipment_name',
        'equipment.sku as equipment_sku',
        'bookings.booking_number',
        db.raw("COALESCE(ack.first_name || ' ' || ack.last_name, null) as acknowledged_by_name"),
        db.raw("COALESCE(res.first_name || ' ' || res.last_name, null) as resolved_by_name")
      )
      .first();

    if (!alert) return null;

    return this.formatAlert(alert);
  }

  /**
   * List alerts with filters
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async list(filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = db('inventory_alerts')
      .leftJoin('equipment', 'inventory_alerts.equipment_id', 'equipment.id')
      .leftJoin('bookings', 'inventory_alerts.booking_id', 'bookings.id')
      .orderByRaw(`
        CASE inventory_alerts.severity 
          WHEN 'critical' THEN 1 
          WHEN 'warning' THEN 2 
          ELSE 3 
        END
      `)
      .orderBy('inventory_alerts.created_at', 'desc');

    if (filters.status) {
      query.where('inventory_alerts.status', filters.status);
    }

    if (filters.type) {
      query.where('inventory_alerts.type', filters.type);
    }

    if (filters.severity) {
      query.where('inventory_alerts.severity', filters.severity);
    }

    if (filters.equipmentId) {
      query.where('inventory_alerts.equipment_id', filters.equipmentId);
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [countResult, rows] = await Promise.all([
      query.clone().count('* as count').first(),
      query
        .select(
          'inventory_alerts.*',
          'equipment.name as equipment_name',
          'equipment.sku as equipment_sku',
          'bookings.booking_number'
        )
        .limit(pagination.limit)
        .offset(offset)
    ]);

    return {
      data: rows.map(this.formatAlert),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      }
    };
  }

  /**
   * Get active alerts summary
   * @returns {Promise<Object>}
   */
  static async getActiveSummary() {
    const summary = await db('inventory_alerts')
      .where('status', 'active')
      .select(
        'type',
        'severity',
        db.raw('COUNT(*) as count')
      )
      .groupBy('type', 'severity');

    const result = {
      total: 0,
      critical: 0,
      warning: 0,
      info: 0,
      byType: {}
    };

    for (const row of summary) {
      result.total += parseInt(row.count);
      result[row.severity] += parseInt(row.count);
      
      if (!result.byType[row.type]) {
        result.byType[row.type] = { total: 0, critical: 0, warning: 0, info: 0 };
      }
      result.byType[row.type][row.severity] += parseInt(row.count);
      result.byType[row.type].total += parseInt(row.count);
    }

    return result;
  }

  /**
   * Acknowledge alert
   * @param {string} id - Alert ID
   * @param {string} userId - User acknowledging
   */
  static async acknowledge(id, userId) {
    const [alert] = await db('inventory_alerts')
      .where({ id })
      .update({
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date()
      })
      .returning('*');

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    return this.findById(id);
  }

  /**
   * Resolve alert
   * @param {string} id - Alert ID
   * @param {string} userId - User resolving
   * @param {string} notes - Resolution notes
   */
  static async resolve(id, userId, notes = null) {
    const [alert] = await db('inventory_alerts')
      .where({ id })
      .update({
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date(),
        resolution_notes: notes
      })
      .returning('*');

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    return this.findById(id);
  }

  /**
   * Ignore alert
   * @param {string} id - Alert ID
   * @param {string} userId - User ignoring
   */
  static async ignore(id, userId) {
    const [alert] = await db('inventory_alerts')
      .where({ id })
      .update({
        status: 'ignored',
        resolved_by: userId,
        resolved_at: new Date()
      })
      .returning('*');

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    return this.findById(id);
  }

  /**
   * Check for overdue returns and create alerts
   */
  static async checkOverdueReturns() {
    const overdueBookings = await db('bookings')
      .join('booking_items', 'bookings.id', 'booking_items.booking_id')
      .join('equipment', 'booking_items.equipment_id', 'equipment.id')
      .join('clients', 'bookings.client_id', 'clients.id')
      .where('bookings.return_datetime', '<', db.raw('NOW() - INTERVAL \'2 hours\''))
      .whereIn('booking_items.status', ['picked_up', 'reserved'])
      .whereNotIn('bookings.status', ['completed', 'cancelled'])
      .select(
        'bookings.id as booking_id',
        'bookings.booking_number',
        'bookings.return_datetime',
        'equipment.id as equipment_id',
        'equipment.name as equipment_name',
        'clients.contact_name as client_name',
        'clients.phone as client_phone',
        'clients.email as client_email'
      );

    const alerts = [];

    for (const item of overdueBookings) {
      const hoursOverdue = Math.floor(
        (new Date() - new Date(item.return_datetime)) / (1000 * 60 * 60)
      );

      const alert = await this.create({
        type: 'overdue_return',
        bookingId: item.booking_id,
        equipmentId: item.equipment_id,
        title: `Overdue Return: ${item.equipment_name}`,
        description: `${item.client_name} is ${hoursOverdue} hours overdue on ${item.equipment_name}`,
        severity: hoursOverdue > 24 ? 'critical' : 'warning',
        data: {
          hours_overdue: hoursOverdue,
          client_name: item.client_name,
          client_phone: item.client_phone,
          client_email: item.client_email,
          booking_number: item.booking_number
        }
      });

      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Check for maintenance due
   */
  static async checkMaintenanceDue() {
    const maintenanceDue = await db('equipment')
      .where(function() {
        this.where('next_maintenance_date', '<=', db.raw('NOW() + INTERVAL \'7 days\''))
          .orWhereNull('next_maintenance_date')
          .where('last_maintenance_date', '<', db.raw('NOW() - INTERVAL \'90 days\''));
      })
      .whereNull('deleted_at')
      .select('*');

    const alerts = [];

    for (const equipment of maintenanceDue) {
      const alert = await this.create({
        type: 'maintenance_due',
        equipmentId: equipment.id,
        title: `Maintenance Due: ${equipment.name}`,
        description: `Equipment ${equipment.name} (${equipment.sku}) is due for maintenance`,
        severity: 'warning',
        data: {
          last_maintenance: equipment.last_maintenance_date,
          next_maintenance: equipment.next_maintenance_date,
          sku: equipment.sku
        }
      });

      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Check for low stock
   */
  static async checkLowStock() {
    const lowStock = await db('equipment_stock_levels')
      .join('equipment', 'equipment_stock_levels.equipment_id', 'equipment.id')
      .whereRaw('equipment_stock_levels.available_quantity <= equipment_stock_levels.min_stock_level')
      .where('equipment.status', 'available')
      .select(
        'equipment.*',
        'equipment_stock_levels.available_quantity',
        'equipment_stock_levels.min_stock_level'
      );

    const alerts = [];

    for (const item of lowStock) {
      const alert = await this.create({
        type: 'low_stock',
        equipmentId: item.id,
        title: `Low Stock: ${item.name}`,
        description: `Only ${item.available_quantity} units available (min: ${item.min_stock_level})`,
        severity: item.available_quantity === 0 ? 'critical' : 'warning',
        data: {
          available: item.available_quantity,
          minimum: item.min_stock_level,
          sku: item.sku
        }
      });

      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Record equipment condition change
   * @param {Object} data - Condition change data
   */
  static async recordConditionChange(data) {
    const [record] = await db('equipment_condition_history')
      .insert({
        equipment_id: data.equipmentId,
        old_condition: data.oldCondition,
        new_condition: data.newCondition,
        reason: data.reason,
        notes: data.notes,
        photos: JSON.stringify(data.photos || []),
        changed_by: data.changedBy,
        booking_id: data.bookingId
      })
      .returning('*');

    // Update equipment condition
    await db('equipment')
      .where('id', data.equipmentId)
      .update({
        condition: data.newCondition,
        updated_at: new Date()
      });

    // Create alert if condition degraded
    if (this.isConditionDegraded(data.oldCondition, data.newCondition)) {
      await this.create({
        type: 'condition_change',
        equipmentId: data.equipmentId,
        title: `Condition Changed: ${data.equipmentName}`,
        description: `Equipment condition changed from ${data.oldCondition} to ${data.newCondition}`,
        severity: data.newCondition === 'poor' ? 'critical' : 'warning',
        data: {
          old_condition: data.oldCondition,
          new_condition: data.newCondition,
          reason: data.reason
        }
      });
    }

    return record;
  }

  /**
   * Check if condition degraded
   * @param {string} oldCondition - Old condition
   * @param {string} newCondition - New condition
   * @returns {boolean}
   */
  static isConditionDegraded(oldCondition, newCondition) {
    const levels = { excellent: 4, good: 3, fair: 2, poor: 1 };
    return levels[newCondition] < levels[oldCondition];
  }

  /**
   * Get condition history for equipment
   * @param {string} equipmentId - Equipment ID
   * @returns {Promise<Array>}
   */
  static async getConditionHistory(equipmentId) {
    return db('equipment_condition_history')
      .leftJoin('users', 'equipment_condition_history.changed_by', 'users.id')
      .leftJoin('bookings', 'equipment_condition_history.booking_id', 'bookings.id')
      .where('equipment_condition_history.equipment_id', equipmentId)
      .orderBy('equipment_condition_history.created_at', 'desc')
      .select(
        'equipment_condition_history.*',
        db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'System') as changed_by_name"),
        'bookings.booking_number'
      );
  }

  /**
   * Update stock levels
   * @param {string} equipmentId - Equipment ID
   * @param {Object} levels - Stock levels
   */
  static async updateStockLevels(equipmentId, levels) {
    const existing = await db('equipment_stock_levels')
      .where('equipment_id', equipmentId)
      .first();

    const data = {
      total_quantity: levels.totalQuantity,
      available_quantity: levels.availableQuantity,
      rented_quantity: levels.rentedQuantity,
      maintenance_quantity: levels.maintenanceQuantity,
      min_stock_level: levels.minStockLevel,
      reorder_point: levels.reorderPoint,
      reorder_quantity: levels.reorderQuantity,
      auto_reorder: levels.autoReorder,
      vendor_id: levels.vendorId
    };

    if (existing) {
      await db('equipment_stock_levels')
        .where('equipment_id', equipmentId)
        .update(data);
    } else {
      await db('equipment_stock_levels')
        .insert({
          equipment_id: equipmentId,
          ...data
        });
    }

    return this.getStockLevels(equipmentId);
  }

  /**
   * Get stock levels
   * @param {string} equipmentId - Equipment ID
   * @returns {Promise<Object>}
   */
  static async getStockLevels(equipmentId) {
    return db('equipment_stock_levels')
      .where('equipment_id', equipmentId)
      .first();
  }

  /**
   * Format alert object
   * @param {Object} alert - Raw alert data
   * @returns {Object}
   */
  static formatAlert(alert) {
    return {
      ...alert,
      data: alert.data ? JSON.parse(alert.data) : {},
      notificationsSent: alert.notifications_sent ? JSON.parse(alert.notifications_sent) : []
    };
  }
}

module.exports = InventoryAlertModel;
