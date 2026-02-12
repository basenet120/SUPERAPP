const fs = require('fs');
const csv = require('csv-parser');
const db = require('./src/config/database');

const results = [];

fs.createReadStream('./km_equipment.csv')
  .pipe(csv())
  .on('data', (data) => {
    // Parse prices - remove $ and commas
    const kmPrice = parseFloat(data['KM PRICE']?.replace(/[$,]/g, '') || 0);
    const basePrice = parseFloat(data['Our Price']?.replace(/[$,]/g, '') || 0);
    const sellingPrice = parseFloat(data['Selling Price']?.replace(/[$,]/g, '') || 0);
    const qty = parseInt(data['QTY on Hand'] || 0);
    
    // Map to our schema
    results.push({
      sku: data['SKU'],
      name: data['name'],
      category: data['Equipment Category'],
      description: data['Description'] || data['name'],
      km_price: kmPrice,
      base_price: basePrice || sellingPrice || kmPrice * 2.5,
      selling_price: sellingPrice || basePrice || kmPrice * 2.5,
      quantity: qty,
      image_url: data['image_url'],
      type: data['Owner Type']?.includes('3rd') ? 'partner' : 'in_house',
      availability: qty > 0 ? 'In Stock' : 'Call for Availability'
    });
  })
  .on('end', async () => {
    console.log(`Parsed ${results.length} equipment items`);
    
    try {
      // Insert in batches of 100
      const batchSize = 100;
      let inserted = 0;
      
      for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);
        
        for (const item of batch) {
          try {
            await db('equipment').insert(item).onConflict('sku').merge();
            inserted++;
          } catch (err) {
            console.error(`Failed to insert ${item.sku}:`, err.message);
          }
        }
        
        console.log(`Inserted batch ${i/batchSize + 1} (${inserted} total)`);
      }
      
      console.log(`✅ Import complete: ${inserted} items`);
      process.exit(0);
    } catch (error) {
      console.error('Import failed:', error);
      process.exit(1);
    }
  });
