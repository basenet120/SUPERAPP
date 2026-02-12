const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const db = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

router.use(authenticate);

// Pipeline stages
const PIPELINE_STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

// Get all deals
router.get('/', requirePermission('deals.view'), async (req, res, next) => {
  try {
    const { stage, contact_id, limit = 50, offset = 0 } = req.query;
    
    let query = db('deals')
      .select('deals.*', 'contacts.name as contact_name', 'contacts.email as contact_email')
      .leftJoin('contacts', 'deals.contact_id', 'contacts.id')
      .where('deals.tenant_id', req.user.tenantId)
      .orderBy('deals.created_at', 'desc');

    if (stage) {
      query = query.where('deals.stage', stage);
    }

    if (contact_id) {
      query = query.where('deals.contact_id', contact_id);
    }

    const deals = await query.limit(limit).offset(offset);

    res.json({
      success: true,
      data: deals.map(d => ({
        ...d,
        contact: d.contact_name ? {
          name: d.contact_name,
          email: d.contact_email
        } : null
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get pipeline data
router.get('/pipeline', requirePermission('deals.view'), async (req, res, next) => {
  try {
    const pipeline = await db('deals')
      .select('stage')
      .count('* as count')
      .sum('value as total_value')
      .where('tenant_id', req.user.tenantId)
      .whereNot('stage', 'closed_lost')
      .groupBy('stage');

    const formatted = PIPELINE_STAGES.filter(s => s !== 'closed_lost').map(stage => {
      const data = pipeline.find(p => p.stage === stage);
      return {
        name: stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        stage,
        count: data ? parseInt(data.count) : 0,
        value: data ? parseInt(data.total_value) || 0 : 0,
        color: getStageColor(stage)
      };
    });

    const total = formatted.reduce((sum, s) => sum + s.count, 0);

    res.json({
      success: true,
      data: {
        stages: formatted,
        total
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get deal by ID
router.get('/:id', requirePermission('deals.view'), async (req, res, next) => {
  try {
    const deal = await db('deals')
      .select('deals.*', 'contacts.name as contact_name', 'contacts.email as contact_email')
      .leftJoin('contacts', 'deals.contact_id', 'contacts.id')
      .where('deals.id', req.params.id)
      .where('deals.tenant_id', req.user.tenantId)
      .first();

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: { message: 'Deal not found' }
      });
    }

    res.json({
      success: true,
      data: {
        ...deal,
        contact: deal.contact_name ? {
          name: deal.contact_name,
          email: deal.contact_email
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create deal
router.post('/', requirePermission('deals.create'), async (req, res, next) => {
  try {
    const { contact_id, title, description, value, probability = 20, stage = 'new', source, expected_close_date } = req.body;

    const [deal] = await db('deals').insert({
      contact_id,
      title,
      description,
      value,
      probability,
      stage,
      source,
      expected_close_date,
      tenant_id: req.user.tenantId,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    logger.info(`Deal created: ${deal.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: deal
    });
  } catch (error) {
    next(error);
  }
});

// Update deal
router.put('/:id', requirePermission('deals.edit'), async (req, res, next) => {
  try {
    const { contact_id, title, description, value, probability, stage, source, expected_close_date } = req.body;

    const [deal] = await db('deals')
      .where('id', req.params.id)
      .where('tenant_id', req.user.tenantId)
      .update({
        contact_id,
        title,
        description,
        value,
        probability,
        stage,
        source,
        expected_close_date,
        updated_at: new Date()
      })
      .returning('*');

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: { message: 'Deal not found' }
      });
    }

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    next(error);
  }
});

// Update deal stage
router.patch('/:id/stage', requirePermission('deals.edit'), async (req, res, next) => {
  try {
    const { stage } = req.body;

    if (!PIPELINE_STAGES.includes(stage)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid stage' }
      });
    }

    const [deal] = await db('deals')
      .where('id', req.params.id)
      .where('tenant_id', req.user.tenantId)
      .update({
        stage,
        updated_at: new Date()
      })
      .returning('*');

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: { message: 'Deal not found' }
      });
    }

    // Record stage change
    await db('deal_stage_history').insert({
      deal_id: req.params.id,
      from_stage: deal.stage,
      to_stage: stage,
      changed_by: req.user.id,
      changed_at: new Date()
    });

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    next(error);
  }
});

// Delete deal
router.delete('/:id', requirePermission('deals.delete'), async (req, res, next) => {
  try {
    const deleted = await db('deals')
      .where('id', req.params.id)
      .where('tenant_id', req.user.tenantId)
      .del();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Deal not found' }
      });
    }

    res.json({
      success: true,
      message: 'Deal deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

function getStageColor(stage) {
  const colors = {
    new: 'bg-brand-500',
    qualified: 'bg-accent-500',
    proposal: 'bg-warning-500',
    negotiation: 'bg-purple-500',
    closed_won: 'bg-success-500',
    closed_lost: 'bg-primary-400'
  };
  return colors[stage] || 'bg-primary-400';
}

module.exports = router;
