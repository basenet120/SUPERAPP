const express = require('express');
const quickbooksService = require('../services/quickbooksService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { ValidationError } = require('../utils/errors');

const router = express.Router();

router.use(authenticate);

// Initiate QuickBooks OAuth
router.get('/connect', requirePermission('system.settings'), async (req, res) => {
  const authUrl = quickbooksService.getAuthUrl();
  res.json({ success: true, data: { authUrl } });
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { url } = req;
    const userId = req.user.id;

    const connection = await quickbooksService.handleCallback(url, userId);

    res.json({
      success: true,
      message: 'QuickBooks connected successfully',
      data: {
        companyName: connection.company_name,
        realmId: connection.realm_id
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'QB_CONNECTION_FAILED',
        message: error.message
      }
    });
  }
});

// Sync customers from QuickBooks
router.post('/sync/customers', requirePermission('system.settings'), async (req, res) => {
  try {
    const { realmId } = req.body;
    
    if (!realmId) {
      throw new ValidationError('Realm ID is required');
    }

    const result = await quickbooksService.syncCustomers(realmId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_FAILED',
        message: error.message
      }
    });
  }
});

// Sync payments from QuickBooks
router.post('/sync/payments', requirePermission('system.settings'), async (req, res) => {
  try {
    const { realmId } = req.body;
    
    if (!realmId) {
      throw new ValidationError('Realm ID is required');
    }

    const result = await quickbooksService.syncPayments(realmId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_FAILED',
        message: error.message
      }
    });
  }
});

// Get connection status
router.get('/status', async (req, res) => {
  try {
    const db = require('../config/database');
    
    const connections = await db('quickbooks_connections')
      .where({ user_id: req.user.id, active: true })
      .select('realm_id', 'company_name', 'connected_at', 'last_sync_at');

    res.json({
      success: true,
      data: connections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: error.message
      }
    });
  }
});

// Webhook for QuickBooks events
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature (implement according to QB docs)
    const payload = req.body;

    // Log webhook event
    const db = require('../config/database');
    await db('webhook_events').insert({
      event_type: payload.eventNotifications?.[0]?.dataChangeEvent?.entities?.[0]?.name || 'unknown',
      source: 'quickbooks',
      payload: JSON.stringify(payload)
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('QuickBooks webhook error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
