const csvImportService = require('../services/csvImportService');
const CSVImportJob = require('../models/CSVImportJob');
const db = require('../config/database');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * CSV Import Controller
 * Handles equipment and other CSV imports
 */
class CSVImportController {
  /**
   * Upload and validate CSV file
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async uploadAndValidate(req, res, next) {
    try {
      const { csvData, type = 'equipment' } = req.body;

      if (!csvData) {
        throw new ValidationError('CSV data is required');
      }

      // Parse CSV
      const rows = csvImportService.parseCSV(csvData);
      
      if (rows.length === 0) {
        throw new ValidationError('No data found in CSV');
      }

      // Auto-detect column mappings
      const headers = Object.keys(rows[0]);
      const detectedMappings = csvImportService.detectColumnMappings(headers);

      // Validate data
      const validation = csvImportService.validateCSV(rows);

      res.json({
        success: true,
        data: {
          totalRows: rows.length,
          headers,
          detectedMappings,
          validation,
          sampleData: rows.slice(0, 5)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start CSV import job
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async startImport(req, res, next) {
    try {
      const {
        csvData,
        mappings,
        vendorId,
        defaultCategoryId,
        markupMultiplier = 2.5,
        categoryMappings = {},
        options = {}
      } = req.body;

      if (!csvData) {
        throw new ValidationError('CSV data is required');
      }

      // Parse CSV
      const rows = csvImportService.parseCSV(csvData);
      
      if (rows.length === 0) {
        throw new ValidationError('No data found in CSV');
      }

      // Create import job
      const job = await CSVImportJob.create({
        type: 'equipment',
        totalRows: rows.length,
        createdBy: req.user.id,
        fileName: options.fileName || 'import.csv',
        fileSize: csvData.length,
        mappings,
        options: {
          vendorId,
          defaultCategoryId,
          markupMultiplier,
          categoryMappings,
          ...options
        }
      });

      // Start import in background
      // In production, this should be queued with a job processor like Bull
      setImmediate(async () => {
        try {
          await csvImportService.importWithProgress(job.id, rows, {
            vendorId,
            defaultCategoryId,
            markupMultiplier,
            categoryMappings
          });
        } catch (error) {
          logger.error('Background import error:', error);
          await CSVImportJob.updateProgress(job.id, {
            status: 'failed',
            errorLog: JSON.stringify([{ error: error.message }]),
            completedAt: new Date()
          });
        }
      });

      res.json({
        success: true,
        data: {
          jobId: job.id,
          status: 'pending',
          totalRows: rows.length,
          message: 'Import started successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get import job status
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getJobStatus(req, res, next) {
    try {
      const { id } = req.params;
      
      const job = await CSVImportJob.findById(id);
      
      if (!job) {
        throw new ValidationError('Import job not found');
      }

      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List import jobs
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async listJobs(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type,
        status 
      } = req.query;

      const result = await CSVImportJob.list(
        { type, status },
        { page: parseInt(page), limit: parseInt(limit) }
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel import job
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async cancelJob(req, res, next) {
    try {
      const { id } = req.params;
      
      const job = await CSVImportJob.findById(id);
      
      if (!job) {
        throw new ValidationError('Import job not found');
      }

      if (!['pending', 'processing'].includes(job.status)) {
        throw new ValidationError('Cannot cancel a completed or failed job');
      }

      await CSVImportJob.updateProgress(id, {
        status: 'cancelled',
        completedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Import job cancelled'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get import templates
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getTemplates(req, res, next) {
    try {
      const templates = await db('equipment_import_templates')
        .where('status', 'active')
        .orderBy('name');

      res.json({
        success: true,
        data: templates.map(t => ({
          ...t,
          column_mappings: JSON.parse(t.column_mappings),
          default_values: JSON.parse(t.default_values),
          transform_rules: JSON.parse(t.transform_rules)
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save import template
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async saveTemplate(req, res, next) {
    try {
      const {
        name,
        description,
        columnMappings,
        defaultValues,
        transformRules,
        vendorId,
        markupPercentage
      } = req.body;

      const [template] = await db('equipment_import_templates')
        .insert({
          name,
          description,
          column_mappings: JSON.stringify(columnMappings),
          default_values: JSON.stringify(defaultValues || {}),
          transform_rules: JSON.stringify(transformRules || {}),
          vendor_id: vendorId,
          markup_percentage: markupPercentage,
          created_by: req.user.id
        })
        .returning('*');

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download CSV template
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async downloadTemplate(req, res, next) {
    try {
      const template = csvImportService.generateTemplate();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="equipment-import-template.csv"');
      res.send(template);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Preview import data
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async previewImport(req, res, next) {
    try {
      const {
        csvData,
        mappings,
        vendorId,
        defaultCategoryId,
        markupMultiplier = 2.5,
        categoryMappings = {}
      } = req.body;

      if (!csvData) {
        throw new ValidationError('CSV data is required');
      }

      // Parse first few rows for preview
      const rows = csvImportService.parseCSV(csvData);
      const previewRows = rows.slice(0, 10);

      // Transform rows
      const transformed = [];
      for (const row of previewRows) {
        try {
          // Apply mappings to row
          const mappedRow = {};
          Object.entries(mappings).forEach(([csvCol, field]) => {
            if (row[csvCol] !== undefined) {
              mappedRow[field] = row[csvCol];
            }
          });

          const transformedRow = await csvImportService.transformRow(mappedRow, {
            vendorId,
            defaultCategoryId,
            markupMultiplier,
            categoryMappings
          });

          transformed.push({
            original: row,
            transformed: transformedRow,
            valid: true
          });
        } catch (error) {
          transformed.push({
            original: row,
            error: error.message,
            valid: false
          });
        }
      }

      res.json({
        success: true,
        data: {
          preview: transformed,
          totalRows: rows.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CSVImportController();
