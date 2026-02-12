const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const searchController = require('../controllers/searchController');

// Global search
router.get('/', authenticate, searchController.globalSearch);
router.get('/suggestions', authenticate, searchController.getSuggestions);

// Advanced search
router.post('/advanced', authenticate, searchController.advancedSearch);

// Saved searches
router.get('/saved', authenticate, searchController.getSavedSearches);
router.post('/saved', authenticate, searchController.saveSearch);
router.delete('/saved/:id', authenticate, searchController.deleteSavedSearch);

module.exports = router;