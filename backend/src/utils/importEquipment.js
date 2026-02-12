const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const db = require('./config/database');
const logger = require('./utils/logger');

/**
 * KM Rental Equipment Import Utility
 * 
 * Imports equipment from KM Rental CSV export
 * Expected CSV columns:
 * - Item Name
 * - SKU
 * - Category
 * - Description
 * - Daily Rate
 * - Weekly Rate
 * - Monthly Rate
 * - Image URL
 * - Specifications (JSON string)
 */

class EquipmentImporter {
  constructor() {
    this.results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: []
    };
  }

  async importFromCSV(filePath, options = {}) {
    const { vendorId, categoryMappings = {}, dryRun = false } = options;

    logger.info(`Starting import from ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
          stream.pause();
          
          try {
            await this.processRow(row, vendorId, categoryMappings, dryRun);
          } catch (error) {
            this.results.errors.push({
              row: this.results.processed,
              sku: row.SKU,
              error: error.message
            });
          }
          
          this.results.processed++;
          stream.resume();
        })
        .on('end', () => {
          logger.info('Import completed', this.results);
          resolve(this.results);
        })
        .on('error', reject);
    });
  }

  async processRow(row, vendorId, categoryMappings, dryRun) {
    // Map category
    let categoryId = categoryMappings[row.Category];
    
    if (!categoryId && row.Category) {
      // Try to find or create category
      const category = await db('equipment_categories')
        .where({ name: row.Category })
        .first();
      
      if (category) {
        categoryId = category.id;
      } else if (!dryRun) {
        // Create new category
        const [newCategory] = await db('equipment_categories')
          .insert({
            name: row.Category,
            slug: row.Category.toLowerCase().replace(/\s+/g, '-'),
            description: `Imported from KM Rental`
          })
          .returning('*');
        categoryId = newCategory.id;
      }
    }

    // Parse specifications
    let specifications = {};
    try {
      if (row.Specifications) {
        specifications = JSON.parse(row.Specifications);
      }
    } catch (e) {
      // If not valid JSON, use as string
      specifications = { details: row.Specifications };
    }

    // Parse images
    let images = [];
    if (row['Image URL']) {
      images = row['Image URL'].split(',').map(url => url.trim());
    }

    // Parse pricing (KM Rental rates - will apply markup)
    const dailyRate = parseFloat(row['Daily Rate']) || 0;
    const weeklyRate = parseFloat(row['Weekly Rate']) || dailyRate * 3;
    const monthlyRate = parseFloat(row['Monthly Rate']) || dailyRate * 10;

    // Apply 2.5x markup for partner equipment
    const markupMultiplier = 2.5;

    const equipmentData = {
      name: row['Item Name'],
      sku: row.SKU,
      description: row.Description,
      category_id: categoryId,
      vendor_id: vendorId,
      ownership_type: 'partner',
      status: 'available',
      condition: 'good',
      daily_rate: dailyRate * markupMultiplier,
      weekly_rate: weeklyRate * markupMultiplier,
      monthly_rate: monthlyRate * markupMultiplier,
      specifications: JSON.stringify(specifications),
      images: JSON.stringify(images),
      location: 'KM Rental Partner'
    };

    if (dryRun) {
      logger.info('Dry run - would create:', equipmentData);
      return;
    }

    // Check if exists
    const existing = await db('equipment')
      .where({ sku: equipmentData.sku })
      .first();

    if (existing) {
      // Update existing
      await db('equipment')
        .where({ id: existing.id })
        .update({
          ...equipmentData,
          updated_at: new Date()
        });
      this.results.updated++;
    } else {
      // Create new
      await db('equipment').insert(equipmentData);
      this.results.created++;
    }
  }

  async validateImport(filePath) {
    logger.info(`Validating import from ${filePath}`);

    const validations = {
      totalRows: 0,
      validRows: 0,
      invalidRows: [],
      missingRequired: []
    };

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          validations.totalRows++;

          const errors = [];
          
          if (!row['Item Name']) {
            errors.push('Missing Item Name');
          }
          
          if (!row.SKU) {
            errors.push('Missing SKU');
          }
          
          if (!row['Daily Rate']) {
            errors.push('Missing Daily Rate');
          }

          if (errors.length > 0) {
            validations.invalidRows.push({
              row: validations.totalRows,
              sku: row.SKU,
              errors
            });
          } else {
            validations.validRows++;
          }
        })
        .on('end', () => {
          resolve(validations);
        })
        .on('error', reject);
    });
  }
}

// CLI usage
if (require.main === module) {
  const filePath = process.argv[2];
  const vendorId = process.argv[3];
  const dryRun = process.argv.includes('--dry-run');
  const validate = process.argv.includes('--validate');

  if (!filePath) {
    console.log('Usage: node importEquipment.js <csv-file> [vendor-id] [--dry-run] [--validate]');
    process.exit(1);
  }

  const importer = new EquipmentImporter();

  if (validate) {
    importer.validateImport(filePath)
      .then(results => {
        console.log('Validation Results:');
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
      })
      .catch(err => {
        console.error('Validation failed:', err);
        process.exit(1);
      });
  } else {
    importer.importFromCSV(filePath, { vendorId, dryRun })
      .then(() => {
        console.log('Import completed');
        process.exit(0);
      })
      .catch(err => {
        console.error('Import failed:', err);
        process.exit(1);
      });
  }
}

module.exports = EquipmentImporter;
