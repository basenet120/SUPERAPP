const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const simpleEquipmentController = require('../controllers/simpleEquipmentController');

// All routes require authentication
router.use(authenticate);

// List equipment
router.get('/', simpleEquipmentController.list);

// Get categories
router.get('/categories', simpleEquipmentController.getCategories);

// Get by ID
router.get('/:id', simpleEquipmentController.getById);

module.exports = router;
