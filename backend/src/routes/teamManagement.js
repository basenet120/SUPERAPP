const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const teamController = require('../controllers/teamManagementController');

// All routes require authentication
router.use(authenticate);

// Employees
router.post('/', requirePermission('users', 'create'), teamController.createEmployee);
router.get('/', requirePermission('users', 'read'), teamController.listEmployees);
router.get('/skills', requirePermission('users', 'read'), teamController.getSkillCategories);
router.get('/my-profile', teamController.getMyProfile);
router.get('/:id', requirePermission('users', 'read'), teamController.getEmployee);
router.patch('/:id', requirePermission('users', 'update'), teamController.updateEmployee);

// Assignments
router.post('/assignments', requirePermission('bookings', 'update'), teamController.assignToBooking);
router.get('/:id/assignments', requirePermission('users', 'read'), teamController.getEmployeeAssignments);
router.get('/bookings/:bookingId/assignments', requirePermission('bookings', 'read'), teamController.getBookingAssignments);
router.patch('/assignments/:assignmentId', requirePermission('bookings', 'update'), teamController.updateAssignment);

// Availability
router.get('/:id/availability', requirePermission('users', 'read'), teamController.getAvailability);
router.post('/:id/availability', requirePermission('users', 'update'), teamController.setAvailability);

// Time Tracking
router.post('/:employeeId/clock-in', teamController.clockIn);
router.post('/time-entries/:entryId/clock-out', teamController.clockOut);
router.get('/:id/time-entries', requirePermission('users', 'read'), teamController.getTimeEntries);
router.get('/:id/time-summary', requirePermission('users', 'read'), teamController.getTimeSummary);

module.exports = router;
