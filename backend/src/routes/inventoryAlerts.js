const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const inventoryAlertController = require('../controllers/inventoryAlertController');

// All routes require authentication
router.use(authenticate);

// Alerts
router.get('/', requirePermission('equipment', 'read'), inventoryAlertController.getAlerts);
router.get('/summary', requirePermission('equipment', 'read'), inventoryAlertController.getSummary);
router.get('/:id', requirePermission('equipment', 'read'), inventoryAlertController.getAlert);
router.post('/:id/acknowledge', requirePermission('equipment', 'update'), inventoryAlertController.acknowledgeAlert);
router.post('/:id/resolve', requirePermission('equipment', 'update'), inventoryAlertController.resolveAlert);
router.post('/:id/ignore', requirePermission('equipment', 'update'), inventoryAlertController.ignoreAlert);

// Checks
router.post('/run-checks', requirePermission('equipment', 'update'), inventoryAlertController.runChecks);

// Condition Tracking
router.get('/equipment/:equipmentId/condition-history', requirePermission('equipment', 'read'), inventoryAlertController.getConditionHistory);
router.post('/equipment/condition-change', requirePermission('equipment', 'update'), inventoryAlertController.recordConditionChange);

// Stock Levels
router.get('/equipment/:equipmentId/stock', requirePermission('equipment', 'read'), inventoryAlertController.getStockLevels);
router.patch('/equipment/:equipmentId/stock', requirePermission('equipment', 'update'), inventoryAlertController.updateStockLevels);

module.exports = router;
