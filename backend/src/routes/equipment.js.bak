const express = require('express');
const equipmentController = require('../controllers/equipmentController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// Equipment CRUD
router.get('/', requirePermission('equipment.view'), equipmentController.list);
router.post('/', requirePermission('equipment.create'), equipmentController.create);
router.get('/categories', equipmentController.getCategories);
router.post('/categories', requirePermission('equipment.create'), equipmentController.createCategory);
router.get('/vendors', equipmentController.getVendors);
router.post('/vendors', requirePermission('equipment.create'), equipmentController.createVendor);
router.get('/:id', requirePermission('equipment.view'), equipmentController.getById);
router.put('/:id', requirePermission('equipment.edit'), equipmentController.update);
router.delete('/:id', requirePermission('equipment.delete'), equipmentController.delete);
router.get('/:id/availability', requirePermission('equipment.view'), equipmentController.checkAvailability);

// Bulk import
router.post('/import', requirePermission('equipment.create'), equipmentController.bulkImport);

module.exports = router;
