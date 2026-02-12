const db = require('../config/database');
const logger = require('../utils/logger');
const EquipmentModel = require('../models/Equipment');
const CSVImportJob = require('../models/CSVImportJob');

/**
 * Enhanced Equipment CSV Import Service
 * Handles bulk imports with progress tracking and validation
 */
class EquipmentCSVImportService {
  constructor() {
    this.validationRules = {
      required: ['name', 'dailyRate'],
      numeric: ['dailyRate', 'weeklyRate', 'monthlyRate', 'purchasePrice', 'markupPercentage'],
      integer: ['quantity'],
      email: ['vendorEmail'],
      url: ['imageUrl', 'website']
    };

    this.defaultColumnMappings = {
      'Item Name': 'name',
      'Name': 'name',
      'Item': 'name',
      'SKU': 'sku',
      'Item #': 'sku',
      'Item Number': 'sku',
      'Category': 'category',
      'Category Name': 'category',
      'Description': 'description',
      'Desc': 'description',
      'Daily Rate': 'dailyRate',
      'Day': 'dailyRate',
      'Price/Day': 'dailyRate',
      'Weekly Rate': 'weeklyRate',
      'Week': 'weeklyRate',
      'Price/Week': 'weeklyRate',
      'Monthly Rate': 'monthlyRate',
      'Month': 'monthlyRate',
      'Price/Month': 'monthlyRate',
      'Image URL': 'imageUrl',
      'Image': 'imageUrl',
      'Photo': 'imageUrl',
      'Photo URL': 'imageUrl',
      'Images': 'images',
      'Specifications': 'specifications',
      'Specs': 'specifications',
      'Details': 'specifications',
      'Vendor': 'vendor',
      'Vendor Name': 'vendor',
      'Partner': 'vendor',
      'Location': 'location',
      'Warehouse': 'location',
      'Condition': 'condition',
      'Status': 'status',
      'Serial Number': 'serialNumber',
      'Serial': 'serialNumber',
      'S/N': 'serialNumber',
      'Barcode': 'barcode',
      'UPC': 'barcode',
      'Quantity': 'quantity',
      'Qty': 'quantity',
      'Stock': 'quantity'
    };
  }

  /**
   * Parse CSV text into array of objects
   * @param {string} csvText - Raw CSV content
   * @returns {Array}
   */
  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Parse headers
    const headers = this.parseCSVLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        rows.push(row);
      }
    }

    return rows;
  }

  /**
   * Parse a single CSV line handling quoted values
   * @param {string} line - CSV line
   * @returns {Array}
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Auto-detect column mappings from CSV headers
   * @param {Array} headers - CSV column headers
   * @returns {Object}
   */
  detectColumnMappings(headers) {
    const mappings = {};
    
    headers.forEach(header => {
      const normalizedHeader = header.trim();
      const mappedField = this.defaultColumnMappings[normalizedHeader];
      
      if (mappedField) {
        mappings[normalizedHeader] = mappedField;
      } else {
        // Try fuzzy matching
        const lowerHeader = normalizedHeader.toLowerCase();
        for (const [csvCol, field] of Object.entries(this.defaultColumnMappings)) {
          if (lowerHeader.includes(csvCol.toLowerCase())) {
            mappings[normalizedHeader] = field;
            break;
          }
        }
      }
    });

    return mappings;
  }

  /**
   * Validate a single row
   * @param {Object} row - CSV row data
   * @param {number} rowNumber - Row number for error reporting
   * @returns {Object}
   */
  validateRow(row, rowNumber) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!row.name || row.name.trim() === '') {
      errors.push(`Row ${rowNumber}: Item Name is required`);
    }

    if (!row.dailyRate || isNaN(parseFloat(row.dailyRate))) {
      errors.push(`Row ${rowNumber}: Daily Rate must be a valid number`);
    } else if (parseFloat(row.dailyRate) < 0) {
      errors.push(`Row ${rowNumber}: Daily Rate cannot be negative`);
    }

    // Validate numeric fields
    const numericFields = ['dailyRate', 'weeklyRate', 'monthlyRate', 'purchasePrice'];
    numericFields.forEach(field => {
      if (row[field] && isNaN(parseFloat(row[field]))) {
        errors.push(`Row ${rowNumber}: ${field} must be a number`);
      }
    });

    // Validate category exists or can be created
    if (row.category && row.category.length > 100) {
      warnings.push(`Row ${rowNumber}: Category name is very long (${row.category.length} chars)`);
    }

    // Validate image URLs
    if (row.imageUrl) {
      const urls = row.imageUrl.split(',').map(u => u.trim()).filter(u => u);
      urls.forEach(url => {
        if (!this.isValidURL(url)) {
          warnings.push(`Row ${rowNumber}: Image URL may be invalid: ${url}`);
        }
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate entire CSV data
   * @param {Array} rows - Parsed CSV rows
   * @returns {Object}
   */
  validateCSV(rows) {
    const result = {
      totalRows: rows.length,
      validRows: 0,
      invalidRows: 0,
      errors: [],
      warnings: [],
      sampleData: rows.slice(0, 5)
    };

    const seenSkus = new Set();

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 for header and 1-indexing
      const validation = this.validateRow(row, rowNumber);

      // Check for duplicate SKUs within the CSV
      if (row.sku) {
        if (seenSkus.has(row.sku)) {
          validation.errors.push(`Row ${rowNumber}: Duplicate SKU "${row.sku}" in import file`);
        }
        seenSkus.add(row.sku);
      }

      if (validation.valid) {
        result.validRows++;
      } else {
        result.invalidRows++;
        result.errors.push(...validation.errors);
      }

      result.warnings.push(...validation.warnings);
    });

    return result;
  }

  /**
   * Transform a CSV row to equipment data
   * @param {Object} row - CSV row
   * @param {Object} options - Transform options
   * @returns {Object}
   */
  async transformRow(row, options = {}) {
    const {
      vendorId,
      defaultCategoryId,
      markupMultiplier = 2.5,
      categoryMappings = {}
    } = options;

    // Parse category
    let categoryId = defaultCategoryId;
    if (row.category) {
      categoryId = categoryMappings[row.category];
      
      if (!categoryId) {
        // Try to find existing category
        const category = await db('equipment_categories')
          .where('name', 'ilike', row.category)
          .first();
        
        if (category) {
          categoryId = category.id;
        }
      }
    }

    // Parse specifications
    let specifications = {};
    try {
      if (row.specifications) {
        specifications = JSON.parse(row.specifications);
      }
    } catch (e) {
      // If not valid JSON, store as details
      specifications = { details: row.specifications };
    }

    // Parse images
    let images = [];
    if (row.imageUrl) {
      images = row.imageUrl.split(',').map(url => url.trim()).filter(url => url);
    } else if (row.images) {
      try {
        const parsed = JSON.parse(row.images);
        images = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        images = row.images.split(',').map(url => url.trim()).filter(url => url);
      }
    }

    // Parse pricing with optional markup
    const dailyRate = parseFloat(row.dailyRate) || 0;
    const weeklyRate = parseFloat(row.weeklyRate) || dailyRate * 5;
    const monthlyRate = parseFloat(row.monthlyRate) || dailyRate * 20;

    // Apply markup for partner equipment
    const applyMarkup = vendorId && options.applyMarkup !== false;
    const multiplier = applyMarkup ? markupMultiplier : 1;

    return {
      name: row.name.trim(),
      sku: row.sku?.trim() || null,
      description: row.description?.trim() || null,
      category_id: categoryId,
      vendor_id: vendorId || null,
      ownership_type: vendorId ? 'partner' : 'owned',
      status: this.normalizeStatus(row.status) || 'available',
      condition: this.normalizeCondition(row.condition) || 'good',
      daily_rate: Math.round(dailyRate * multiplier * 100) / 100,
      weekly_rate: Math.round(weeklyRate * multiplier * 100) / 100,
      monthly_rate: Math.round(monthlyRate * multiplier * 100) / 100,
      specifications: JSON.stringify(specifications),
      images: JSON.stringify(images),
      location: row.location?.trim() || null,
      serial_number: row.serialNumber?.trim() || null,
      barcode: row.barcode?.trim() || null
    };
  }

  /**
   * Import CSV data with progress tracking
   * @param {string} jobId - Import job ID
   * @param {Array} rows - Parsed CSV rows
   * @param {Object} options - Import options
   */
  async importWithProgress(jobId, rows, options = {}) {
    const {
      vendorId,
      defaultCategoryId,
      markupMultiplier = 2.5,
      categoryMappings = {},
      onProgress
    } = options;

    const results = {
      created: [],
      updated: [],
      errors: []
    };

    // Update job status to processing
    await CSVImportJob.updateProgress(jobId, {
      status: 'processing',
      totalRows: rows.length
    });

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process in batches for better performance
    const batchSize = 50;
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          // Check if exists by SKU
          if (row.sku) {
            const existing = await db('equipment')
              .where({ sku: row.sku })
              .first();

            if (existing) {
              // Update existing equipment
              const updateData = await this.transformRow(row, {
                vendorId,
                defaultCategoryId,
                markupMultiplier,
                categoryMappings,
                applyMarkup: existing.ownership_type === 'partner'
              });

              await db('equipment')
                .where({ id: existing.id })
                .update({
                  ...updateData,
                  updated_at: new Date()
                });

              results.updated.push({ id: existing.id, sku: row.sku, name: row.name });
              successCount++;
              continue;
            }
          }

          // Create new equipment
          const equipmentData = await this.transformRow(row, {
            vendorId,
            defaultCategoryId,
            markupMultiplier,
            categoryMappings
          });

          const [newEquipment] = await db('equipment')
            .insert(equipmentData)
            .returning('*');

          results.created.push({ id: newEquipment.id, sku: row.sku, name: row.name });
          successCount++;

        } catch (error) {
          logger.error('Import row error:', error);
          results.errors.push({
            row: processedCount + 2,
            sku: row.sku,
            name: row.name,
            error: error.message
          });
          errorCount++;
        }

        processedCount++;
      }

      // Update progress
      await CSVImportJob.updateProgress(jobId, {
        processedRows: processedCount,
        successCount,
        errorCount
      });

      // Call progress callback if provided
      if (onProgress) {
        onProgress({
          processed: processedCount,
          total: rows.length,
          success: successCount,
          errors: errorCount
        });
      }
    }

    // Mark job as completed
    await CSVImportJob.updateProgress(jobId, {
      status: errorCount > 0 && successCount === 0 ? 'failed' : 'completed',
      processedRows: processedCount,
      successCount,
      errorCount,
      results: JSON.stringify(results),
      errorLog: JSON.stringify(results.errors),
      completedAt: new Date()
    });

    return results;
  }

  /**
   * Normalize status string
   * @param {string} status - Raw status
   * @returns {string}
   */
  normalizeStatus(status) {
    if (!status) return 'available';
    
    const normalized = status.toLowerCase().trim();
    const statusMap = {
      'available': 'available',
      'avail': 'available',
      'in stock': 'available',
      'ready': 'available',
      'rented': 'rented',
      'rent': 'rented',
      'out': 'rented',
      'rental': 'rented',
      'booked': 'rented',
      'maintenance': 'maintenance',
      'maint': 'maintenance',
      'repair': 'maintenance',
      'service': 'maintenance',
      'retired': 'retired',
      'inactive': 'retired',
      'discontinued': 'retired',
      'lost': 'lost',
      'missing': 'lost',
      'stolen': 'lost'
    };

    return statusMap[normalized] || 'available';
  }

  /**
   * Normalize condition string
   * @param {string} condition - Raw condition
   * @returns {string}
   */
  normalizeCondition(condition) {
    if (!condition) return 'good';
    
    const normalized = condition.toLowerCase().trim();
    const conditionMap = {
      'excellent': 'excellent',
      'exc': 'excellent',
      'new': 'excellent',
      'like new': 'excellent',
      'good': 'good',
      'gd': 'good',
      'fair': 'fair',
      'poor': 'poor',
      'bad': 'poor',
      'damaged': 'poor'
    };

    return conditionMap[normalized] || 'good';
  }

  /**
   * Check if string is valid URL
   * @param {string} string - URL string
   * @returns {boolean}
   */
  isValidURL(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Generate KM Rental CSV template
   * @returns {string}
   */
  generateTemplate() {
    const headers = [
      'Item Name',
      'SKU',
      'Category',
      'Description',
      'Daily Rate',
      'Weekly Rate',
      'Monthly Rate',
      'Image URL',
      'Specifications',
      'Vendor',
      'Location',
      'Condition',
      'Status',
      'Serial Number'
    ];

    const sampleRow = [
      'Canon EOS C300 Mark III',
      'CAM-C300-001',
      'Cameras',
      'Professional cinema camera with 4K recording',
      '250.00',
      '750.00',
      '2500.00',
      'https://example.com/image.jpg',
      '{"sensor": "Super 35mm", "resolution": "4K"}',
      'KM Rental',
      'Main Warehouse',
      'Good',
      'Available',
      'SN123456789'
    ];

    return [headers.join(','), sampleRow.join(',')].join('\n');
  }
}

module.exports = new EquipmentCSVImportService();
