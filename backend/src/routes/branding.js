const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const brandingController = require('../controllers/brandingController');

const upload = multer({ storage: multer.memoryStorage() });

// Public branding endpoint (no auth required)
router.get('/public', brandingController.getPublicBranding);

// Protected routes
router.get('/', authenticate, brandingController.getBranding);
router.post('/', authenticate, brandingController.saveBranding);
router.post('/logo', authenticate, upload.single('file'), brandingController.uploadLogo);

// Email templates
router.get('/:brandingId/templates', authenticate, brandingController.getEmailTemplates);
router.put('/:brandingId/templates/:templateKey', authenticate, brandingController.updateEmailTemplate);

// Portal pages
router.get('/:brandingId/pages', authenticate, brandingController.getPortalPages);
router.post('/:brandingId/pages', authenticate, brandingController.createPortalPage);
router.put('/:brandingId/pages/:pageId', authenticate, brandingController.updatePortalPage);
router.delete('/:brandingId/pages/:pageId', authenticate, brandingController.deletePortalPage);

module.exports = router;