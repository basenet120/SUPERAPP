const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const db = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Get all contacts
router.get('/', requirePermission('contacts.view'), async (req, res, next) => {
  try {
    const { search, status, company, limit = 50, offset = 0 } = req.query;
    
    let query = db('contacts')
      .select('contacts.*', 'companies.name as company_name')
      .leftJoin('companies', 'contacts.company_id', 'companies.id')
      .where('contacts.tenant_id', req.user.tenantId)
      .orderBy('contacts.created_at', 'desc');

    if (search) {
      query = query.where(builder => {
        builder.where('contacts.name', 'ilike', `%${search}%`)
          .orWhere('contacts.email', 'ilike', `%${search}%`)
          .orWhere('contacts.phone', 'ilike', `%${search}%`);
      });
    }

    if (status) {
      query = query.where('contacts.status', status);
    }

    if (company) {
      query = query.where('contacts.company_id', company);
    }

    const contacts = await query.limit(limit).offset(offset);
    
    // Parse tags from JSON
    const formattedContacts = contacts.map(c => ({
      ...c,
      tags: c.tags ? JSON.parse(c.tags) : [],
      company: c.company_name
    }));

    res.json({
      success: true,
      data: formattedContacts
    });
  } catch (error) {
    next(error);
  }
});

// Get contact by ID
router.get('/:id', requirePermission('contacts.view'), async (req, res, next) => {
  try {
    const contact = await db('contacts')
      .select('contacts.*', 'companies.name as company_name')
      .leftJoin('companies', 'contacts.company_id', 'companies.id')
      .where('contacts.id', req.params.id)
      .where('contacts.tenant_id', req.user.tenantId)
      .first();

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: { message: 'Contact not found' }
      });
    }

    // Get activities
    const activities = await db('contact_activities')
      .where('contact_id', req.params.id)
      .orderBy('created_at', 'desc')
      .limit(20);

    res.json({
      success: true,
      data: {
        ...contact,
        tags: contact.tags ? JSON.parse(contact.tags) : [],
        company: contact.company_name,
        activities
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create contact
router.post('/', requirePermission('contacts.create'), async (req, res, next) => {
  try {
    const { name, email, phone, company_id, role, tags, status = 'lead' } = req.body;

    const [contact] = await db('contacts').insert({
      name,
      email,
      phone,
      company_id,
      role,
      tags: tags ? JSON.stringify(tags) : '[]',
      status,
      tenant_id: req.user.tenantId,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    logger.info(`Contact created: ${contact.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: {
        ...contact,
        tags: tags || []
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update contact
router.put('/:id', requirePermission('contacts.edit'), async (req, res, next) => {
  try {
    const { name, email, phone, company_id, role, tags, status } = req.body;

    const [contact] = await db('contacts')
      .where('id', req.params.id)
      .where('tenant_id', req.user.tenantId)
      .update({
        name,
        email,
        phone,
        company_id,
        role,
        tags: tags ? JSON.stringify(tags) : undefined,
        status,
        updated_at: new Date()
      })
      .returning('*');

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: { message: 'Contact not found' }
      });
    }

    res.json({
      success: true,
      data: {
        ...contact,
        tags: tags || []
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete contact
router.delete('/:id', requirePermission('contacts.delete'), async (req, res, next) => {
  try {
    const deleted = await db('contacts')
      .where('id', req.params.id)
      .where('tenant_id', req.user.tenantId)
      .del();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Contact not found' }
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get contact activities
router.get('/:id/activities', requirePermission('contacts.view'), async (req, res, next) => {
  try {
    const activities = await db('contact_activities')
      .where('contact_id', req.params.id)
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    next(error);
  }
});

// Add activity
router.post('/:id/activities', requirePermission('contacts.edit'), async (req, res, next) => {
  try {
    const { type, subject, description } = req.body;

    const [activity] = await db('contact_activities').insert({
      contact_id: req.params.id,
      type,
      subject,
      description,
      user_id: req.user.id,
      created_at: new Date()
    }).returning('*');

    // Update last_contact date on contact
    await db('contacts')
      .where('id', req.params.id)
      .update({ last_contact: new Date() });

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    next(error);
  }
});

// Search contacts
router.get('/search', requirePermission('contacts.view'), async (req, res, next) => {
  try {
    const { q } = req.query;
    
    const contacts = await db('contacts')
      .where('tenant_id', req.user.tenantId)
      .where(builder => {
        builder.where('name', 'ilike', `%${q}%`)
          .orWhere('email', 'ilike', `%${q}%`)
          .orWhere('phone', 'ilike', `%${q}%`);
      })
      .limit(10);

    res.json({
      success: true,
      data: contacts.map(c => ({
        ...c,
        tags: c.tags ? JSON.parse(c.tags) : []
      }))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
