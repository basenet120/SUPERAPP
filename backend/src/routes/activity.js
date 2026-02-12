const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const db = require('../config/database');

const router = express.Router();

router.use(authenticate);

// Get recent activity
router.get('/', async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent bookings
    const bookings = await db('bookings')
      .select('bookings.*', 'contacts.name as client_name')
      .leftJoin('contacts', 'bookings.contact_id', 'contacts.id')
      .where('bookings.tenant_id', req.user.tenantId)
      .orderBy('bookings.created_at', 'desc')
      .limit(limit);

    // Get recent contacts
    const contacts = await db('contacts')
      .where('tenant_id', req.user.tenantId)
      .orderBy('created_at', 'desc')
      .limit(limit);

    // Get recent deals
    const deals = await db('deals')
      .select('deals.*', 'contacts.name as contact_name')
      .leftJoin('contacts', 'deals.contact_id', 'contacts.id')
      .where('deals.tenant_id', req.user.tenantId)
      .orderBy('deals.created_at', 'desc')
      .limit(limit);

    // Combine and format
    const activities = [
      ...bookings.map(b => ({
        id: `booking-${b.id}`,
        type: 'booking',
        title: `New booking created`,
        description: `${b.client_name || 'Unknown'} - ${b.project_name || 'Untitled'}`,
        status: b.status === 'confirmed' ? 'success' : 'pending',
        createdAt: b.created_at
      })),
      ...contacts.map(c => ({
        id: `contact-${c.id}`,
        type: 'lead',
        title: 'New contact added',
        description: `${c.name} from ${c.company || 'Unknown'}`,
        status: c.status === 'active' ? 'success' : 'pending',
        createdAt: c.created_at
      })),
      ...deals.map(d => ({
        id: `deal-${d.id}`,
        type: 'deal',
        title: 'Deal updated',
        description: `${d.title || 'Untitled'} - $${d.value || 0}`,
        status: d.stage === 'closed_won' ? 'success' : 'pending',
        createdAt: d.updated_at || d.created_at
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
    const count = await db('notifications')
      .where('user_id', req.user.id)
      .where('read', false)
      .count('* as count')
      .first();

    res.json({
      success: true,
      data: { count: parseInt(count.count) }
    });
  } catch (error) {
    next(error);
  }
});

// Mark as read
router.post('/:id/read', async (req, res, next) => {
  try {
    await db('notifications')
      .where('id', req.params.id)
      .where('user_id', req.user.id)
      .update({ read: true, read_at: new Date() });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.post('/read-all', async (req, res, next) => {
  try {
    await db('notifications')
      .where('user_id', req.user.id)
      .where('read', false)
      .update({ read: true, read_at: new Date() });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
