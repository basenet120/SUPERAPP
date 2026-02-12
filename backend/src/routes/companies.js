const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const db = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

router.use(authenticate);

// Get all companies
router.get('/', requirePermission('companies.view'), async (req, res, next) => {
  try {
    const { search, industry, limit = 50, offset = 0 } = req.query;
    
    let query = db('companies')
      .where('tenant_id', req.user.tenantId)
      .orderBy('name', 'asc');

    if (search) {
      query = query.where(builder => {
        builder.where('name', 'ilike', `%${search}%`)
          .orWhere('website', 'ilike', `%${search}%`);
      });
    }

    if (industry) {
      query = query.where('industry', industry);
    }

    const companies = await query.limit(limit).offset(offset);

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    next(error);
  }
});

// Get company by ID
router.get('/:id', requirePermission('companies.view'), async (req, res, next) => {
  try {
    const company = await db('companies')
      .where('id', req.params.id)
      .where('tenant_id', req.user.tenantId)
      .first();

    if (!company) {
      return res.status(404).json({
        success: false,
        error: { message: 'Company not found' }
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
});

// Create company
router.post('/', requirePermission('companies.create'), async (req, res, next) => {
  try {
    const { name, industry, size, address, website, phone, email } = req.body;

    const [company] = await db('companies').insert({
      name,
      industry,
      size,
      address,
      website,
      phone,
      email,
      tenant_id: req.user.tenantId,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    logger.info(`Company created: ${company.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
});

// Update company
router.put('/:id', requirePermission('companies.edit'), async (req, res, next) => {
  try {
    const { name, industry, size, address, website, phone, email } = req.body;

    const [company] = await db('companies')
      .where('id', req.params.id)
      .where('tenant_id', req.user.tenantId)
      .update({
        name,
        industry,
        size,
        address,
        website,
        phone,
        email,
        updated_at: new Date()
      })
      .returning('*');

    if (!company) {
      return res.status(404).json({
        success: false,
        error: { message: 'Company not found' }
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
});

// Delete company
router.delete('/:id', requirePermission('companies.delete'), async (req, res, next) => {
  try {
    const deleted = await db('companies')
      .where('id', req.params.id)
      .where('tenant_id', req.user.tenantId)
      .del();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Company not found' }
      });
    }

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get company contacts
router.get('/:id/contacts', requirePermission('companies.view'), async (req, res, next) => {
  try {
    const contacts = await db('contacts')
      .where('company_id', req.params.id)
      .where('tenant_id', req.user.tenantId)
      .orderBy('name', 'asc');

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
