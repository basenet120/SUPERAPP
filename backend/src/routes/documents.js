const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const documentController = require('../controllers/documentController');

// All routes require authentication
router.use(authenticate);

// Documents
router.post('/upload', requirePermission('documents', 'create'), documentController.uploadDocument);
router.get('/', requirePermission('documents', 'read'), documentController.listDocuments);
router.get('/statistics', requirePermission('documents', 'read'), documentController.getStatistics);
router.get('/expiring-cois', requirePermission('documents', 'read'), documentController.getExpiringCOIs);
router.get('/:id', requirePermission('documents', 'read'), documentController.getDocument);
router.patch('/:id', requirePermission('documents', 'update'), documentController.updateDocument);
router.delete('/:id', requirePermission('documents', 'delete'), documentController.deleteDocument);
router.post('/:id/restore', requirePermission('documents', 'update'), documentController.restoreDocument);

// Download
router.get('/:id/download', requirePermission('documents', 'read'), documentController.downloadDocument);

// Versions
router.get('/:id/versions', requirePermission('documents', 'read'), documentController.getVersions);
router.post('/:id/versions', requirePermission('documents', 'create'), documentController.createVersion);

// Sharing
router.post('/:id/share', requirePermission('documents', 'update'), documentController.shareDocument);
router.get('/:id/shares', requirePermission('documents', 'read'), documentController.getShares);
router.delete('/shares/:shareId', requirePermission('documents', 'update'), documentController.revokeShare);

// Signatures
router.post('/:id/sign', requirePermission('documents', 'update'), documentController.signDocument);
router.post('/:id/request-signature', requirePermission('documents', 'update'), documentController.requestSignature);

// COI Tracking
router.post('/:id/coi', requirePermission('documents', 'create'), documentController.addCOIDetails);
router.patch('/coi/:coiId/verify', requirePermission('documents', 'update'), documentController.verifyCOI);
router.post('/coi/:coiId/request-renewal', requirePermission('documents', 'update'), documentController.requestCOIRenewal);

// Bulk operations
router.post('/bulk-update', requirePermission('documents', 'update'), documentController.bulkUpdate);
router.post('/bulk-delete', requirePermission('documents', 'delete'), documentController.bulkDelete);

module.exports = router;
