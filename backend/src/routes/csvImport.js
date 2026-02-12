const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const csvImportController = require('../controllers/csvImportController');

// All routes require authentication and equipment management permission
router.use(authenticate);
router.use(requirePermission('equipment', 'update'));

// Upload and validate CSV
router.post('/upload', csvImportController.uploadAndValidate);

// Preview import
router.post('/preview', csvImportController.previewImport);

// Start import job
router.post('/start', csvImportController.startImport);

// Get import job status
router.get('/jobs/:id', csvImportController.getJobStatus);

// List import jobs
router.get('/jobs', csvImportController.listJobs);

// Cancel import job
router.post('/jobs/:id/cancel', csvImportController.cancelJob);

// Get import templates
router.get('/templates', csvImportController.getTemplates);

// Save import template
router.post('/templates', csvImportController.saveTemplate);

// Download CSV template
router.get('/template/download', csvImportController.downloadTemplate);

module.exports = router;
