const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const advancedBookingController = require('../controllers/advancedBookingController');

// All routes require authentication
router.use(authenticate);

// Recurring Bookings
router.post('/recurring', requirePermission('bookings', 'create'), advancedBookingController.createRecurring);
router.get('/recurring', requirePermission('bookings', 'read'), advancedBookingController.listRecurring);
router.get('/recurring/:id', requirePermission('bookings', 'read'), advancedBookingController.getRecurring);
router.patch('/recurring/:id', requirePermission('bookings', 'update'), advancedBookingController.updateRecurring);
router.post('/recurring/:id/cancel', requirePermission('bookings', 'update'), advancedBookingController.cancelRecurring);

// Booking Templates
router.post('/templates', requirePermission('bookings', 'create'), advancedBookingController.createTemplate);
router.get('/templates', requirePermission('bookings', 'read'), advancedBookingController.listTemplates);
router.get('/templates/:id', requirePermission('bookings', 'read'), advancedBookingController.getTemplate);
router.patch('/templates/:id', requirePermission('bookings', 'update'), advancedBookingController.updateTemplate);
router.delete('/templates/:id', requirePermission('bookings', 'delete'), advancedBookingController.deleteTemplate);
router.post('/templates/:id/apply', requirePermission('bookings', 'create'), advancedBookingController.applyTemplate);
router.post('/templates/:id/clone', requirePermission('bookings', 'create'), advancedBookingController.cloneTemplate);

// Equipment Waitlist
router.post('/waitlist', requirePermission('bookings', 'create'), advancedBookingController.addToWaitlist);
router.get('/waitlist', requirePermission('bookings', 'read'), advancedBookingController.listWaitlist);
router.get('/waitlist/stats', requirePermission('bookings', 'read'), advancedBookingController.getWaitlistStats);
router.get('/waitlist/equipment/:equipmentId', requirePermission('bookings', 'read'), advancedBookingController.getEquipmentWaitlist);
router.get('/waitlist/client/:clientId', requirePermission('bookings', 'read'), advancedBookingController.getClientWaitlist);
router.patch('/waitlist/:id', requirePermission('bookings', 'update'), advancedBookingController.updateWaitlist);
router.post('/waitlist/:id/convert', requirePermission('bookings', 'create'), advancedBookingController.convertWaitlist);
router.post('/waitlist/:id/cancel', requirePermission('bookings', 'update'), advancedBookingController.cancelWaitlist);

// Booking Conflicts
router.get('/conflicts/stats', requirePermission('bookings', 'read'), advancedBookingController.getConflictStats);
router.get('/conflicts/booking/:bookingId', requirePermission('bookings', 'read'), advancedBookingController.getBookingConflicts);
router.post('/conflicts/booking/:bookingId/detect', requirePermission('bookings', 'update'), advancedBookingController.detectConflicts);
router.get('/conflicts/equipment/:equipmentId/timeline', requirePermission('bookings', 'read'), advancedBookingController.getAvailabilityTimeline);
router.post('/conflicts/:id/resolve', requirePermission('bookings', 'update'), advancedBookingController.resolveConflict);

module.exports = router;
