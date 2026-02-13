const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

router.use(authenticate);

// Get recent activity
router.get('/', async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent bookings (using existing schema)
    const bookings = await db('bookings')
      .select('bookings.*', 'clients.contact_name as client_name', 'clients.company_name')
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .orderBy('bookings.created_at', 'desc')
      .limit(limit);

    // Get recent clients
    const clients = await db('clients')
      .orderBy('created_at', 'desc')
      .limit(limit);

    // Combine and format
    const activities = [
      ...bookings.map(b => ({
        id: `booking-${b.id}`,
        type: 'booking',
        title: `New booking created`,
        description: `${b.client_name || b.company_name || 'Unknown'} - ${b.booking_number || 'Untitled'}`,
        status: b.status === 'confirmed' ? 'success' : 'pending',
        createdAt: b.created_at
      })),
      ...clients.map(c => ({
        id: `client-${c.id}`,
        type: 'lead',
        title: 'New client added',
        description: `${c.contact_name} from ${c.company_name || 'Unknown'}`,
        status: 'success',
        createdAt: c.created_at
      }))
    ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get('/unread', async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { count: 0 }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
