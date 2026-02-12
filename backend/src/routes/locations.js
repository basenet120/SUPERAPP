const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const locationController = require('../controllers/locationController');

router.get('/', authenticate, locationController.getLocations);
router.post('/', authenticate, locationController.createLocation);
router.get('/:id', authenticate, locationController.getLocation);
router.put('/:id', authenticate, locationController.updateLocation);
router.delete('/:id', authenticate, locationController.deleteLocation);

// Equipment management at location
router.post('/:id/equipment', authenticate, locationController.addEquipment);
router.put('/:id/equipment/:equipmentId', authenticate, locationController.updateEquipmentQuantity);

// Transfers
router.get('/transfers', authenticate, locationController.getTransfers);
router.post('/transfers', authenticate, locationController.createTransfer);
router.put('/transfers/:transferId', authenticate, locationController.updateTransfer);

// User access
router.get('/user/:userId/access', authenticate, locationController.getUserLocations);
router.post('/user/:userId/access/:locationId', authenticate, locationController.grantAccess);

module.exports = router;