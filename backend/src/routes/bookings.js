const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// Booking CRUD
router.get('/', requirePermission('bookings.view'), bookingController.list);
router.post('/', requirePermission('bookings.create'), bookingController.create);
router.get('/stats/dashboard', requirePermission('bookings.view'), bookingController.getDashboardStats);
router.post('/calculate-pricing', requirePermission('bookings.view'), bookingController.calculatePricing);
router.get('/:id', requirePermission('bookings.view'), bookingController.getById);
router.put('/:id', requirePermission('bookings.edit'), bookingController.update);
router.patch('/:id/status', requirePermission('bookings.edit'), bookingController.updateStatus);
router.delete('/:id', requirePermission('bookings.delete'), bookingController.delete);

// Booking items
router.post('/:id/items', requirePermission('bookings.edit'), bookingController.addItem);
router.put('/items/:itemId', requirePermission('bookings.edit'), bookingController.updateItem);
router.delete('/items/:itemId', requirePermission('bookings.edit'), bookingController.removeItem);

// Status history
router.get('/:id/history', requirePermission('bookings.view'), bookingController.getStatusHistory);

module.exports = router;
