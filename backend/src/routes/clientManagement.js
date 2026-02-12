const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const clientManagementController = require('../controllers/clientManagementController');

// All routes require authentication
router.use(authenticate);

// Client CRUD with enhancements
router.get('/', requirePermission('contacts', 'read'), clientManagementController.listClients);
router.get('/:id', requirePermission('contacts', 'read'), clientManagementController.getClient);

// Tier Management
router.get('/tiers/config', requirePermission('contacts', 'read'), clientManagementController.getTierConfig);
router.get('/:id/tier-history', requirePermission('contacts', 'read'), clientManagementController.getTierHistory);
router.patch('/:id/tier', requirePermission('contacts', 'update'), clientManagementController.updateTier);
router.post('/:id/tier/recalculate', requirePermission('contacts', 'update'), clientManagementController.recalculateTier);
router.post('/bulk/tier-update', requirePermission('contacts', 'update'), clientManagementController.bulkUpdateTiers);

// Tags
router.get('/tags/all', requirePermission('contacts', 'read'), clientManagementController.getTags);
router.post('/tags', requirePermission('contacts', 'update'), clientManagementController.createTag);
router.post('/:id/tags', requirePermission('contacts', 'update'), clientManagementController.addTag);
router.delete('/:id/tags/:tagId', requirePermission('contacts', 'update'), clientManagementController.removeTag);

// Notes
router.get('/:id/notes', requirePermission('contacts', 'read'), clientManagementController.getNotes);
router.post('/:id/notes', requirePermission('contacts', 'update'), clientManagementController.addNote);
router.patch('/notes/:noteId', requirePermission('contacts', 'update'), clientManagementController.updateNote);
router.delete('/notes/:noteId', requirePermission('contacts', 'delete'), clientManagementController.deleteNote);

// Communications
router.get('/:id/communications', requirePermission('contacts', 'read'), clientManagementController.getCommunications);
router.post('/:id/communications', requirePermission('contacts', 'update'), clientManagementController.logCommunication);

// Statistics
router.get('/:id/statistics', requirePermission('contacts', 'read'), clientManagementController.getStatistics);

module.exports = router;
