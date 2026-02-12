exports.seed = async function(knex) {
  await knex('equipment_tag_relations').del();
  await knex('equipment_tags').del();
  await knex('equipment').del();
  await knex('equipment_categories').del();
  await knex('vendors').del();

  // Create vendors
  const vendors = await knex('vendors').insert([
    {
      name: 'Base Creative',
      slug: 'base-creative',
      type: 'in_house',
      description: 'In-house equipment inventory',
      status: 'active',
      markup_percentage: 0
    },
    {
      name: 'KM Rental',
      slug: 'km-rental',
      type: 'partner',
      description: 'Partner equipment rental company',
      status: 'active',
      markup_percentage: 250, // 2.5x markup
      rate_cards: JSON.stringify({
        cameras: 1.0,
        lenses: 1.0,
        lighting: 1.0,
        grip: 1.0
      })
    }
  ]).returning('*');

  const baseCreative = vendors.find(v => v.slug === 'base-creative');
  const kmRental = vendors.find(v => v.slug === 'km-rental');

  // Create equipment categories
  const categories = await knex('equipment_categories').insert([
    { name: 'Cameras', slug: 'cameras', description: 'Digital and film cameras', sort_order: 1 },
    { name: 'Lenses', slug: 'lenses', description: 'Camera lenses and adapters', sort_order: 2 },
    { name: 'Lighting', slug: 'lighting', description: 'Studio and location lighting', sort_order: 3 },
    { name: 'Grip', slug: 'grip', description: 'Grip equipment and stands', sort_order: 4 },
    { name: 'Audio', slug: 'audio', description: 'Microphones and recording equipment', sort_order: 5 },
    { name: 'Monitors', slug: 'monitors', description: 'Production monitors and recorders', sort_order: 6 },
    { name: 'Support', slug: 'support', description: 'Tripods, dollies, and stabilization', sort_order: 7 },
    { name: 'Power', slug: 'power', description: 'Batteries and power distribution', sort_order: 8 },
    { name: 'Cables', slug: 'cables', description: 'Video, audio, and power cables', sort_order: 9 },
    { name: 'Accessories', slug: 'accessories', description: 'Miscellaneous accessories', sort_order: 10 }
  ]).returning('*');

  // Create some sample equipment
  const cameraCategory = categories.find(c => c.slug === 'cameras');
  const lensCategory = categories.find(c => c.slug === 'lenses');
  const lightingCategory = categories.find(c => c.slug === 'lighting');

  await knex('equipment').insert([
    {
      name: 'Sony FX6 Cinema Camera',
      sku: 'CAM-SONY-FX6',
      description: 'Full-frame cinema camera with 4K 120fps capability',
      category_id: cameraCategory.id,
      vendor_id: baseCreative.id,
      ownership_type: 'owned',
      status: 'available',
      condition: 'excellent',
      daily_rate: 350.00,
      weekly_rate: 1050.00,
      monthly_rate: 3150.00,
      purchase_price: 6500.00,
      purchase_date: '2023-06-15',
      serial_number: 'SN123456789',
      location: 'Equipment Room A',
      specifications: JSON.stringify({
        sensor: 'Full Frame 10.2MP',
        resolution: '4K up to 120fps',
        mount: 'E-mount',
        weight: '890g'
      })
    },
    {
      name: 'Canon C70 Cinema Camera',
      sku: 'CAM-CANON-C70',
      description: 'RF mount cinema camera with Super 35 sensor',
      category_id: cameraCategory.id,
      vendor_id: baseCreative.id,
      ownership_type: 'owned',
      status: 'available',
      condition: 'excellent',
      daily_rate: 300.00,
      weekly_rate: 900.00,
      monthly_rate: 2700.00,
      purchase_price: 5500.00,
      purchase_date: '2023-08-20',
      serial_number: 'SN987654321',
      location: 'Equipment Room A',
      specifications: JSON.stringify({
        sensor: 'Super 35mm Dual Gain Output',
        resolution: '4K up to 120fps',
        mount: 'RF Mount',
        weight: '1.3kg'
      })
    },
    {
      name: 'Sony FE 24-70mm f/2.8 GM II',
      sku: 'LENS-SONY-2470GM2',
      description: 'Standard zoom lens for Sony E-mount',
      category_id: lensCategory.id,
      vendor_id: baseCreative.id,
      ownership_type: 'owned',
      status: 'available',
      condition: 'excellent',
      daily_rate: 75.00,
      weekly_rate: 225.00,
      monthly_rate: 675.00,
      purchase_price: 2300.00,
      purchase_date: '2023-09-01',
      serial_number: 'SN246810121',
      location: 'Lens Cabinet B',
      specifications: JSON.stringify({
        focal_length: '24-70mm',
        aperture: 'f/2.8',
        mount: 'Sony E-mount',
        weight: '695g'
      })
    },
    {
      name: 'Aputure 600d Pro',
      sku: 'LIGHT-APUTURE-600D',
      description: 'High-output daylight LED with Bowens mount',
      category_id: lightingCategory.id,
      vendor_id: baseCreative.id,
      ownership_type: 'owned',
      status: 'available',
      condition: 'good',
      daily_rate: 125.00,
      weekly_rate: 375.00,
      monthly_rate: 1125.00,
      purchase_price: 1890.00,
      purchase_date: '2023-04-10',
      serial_number: 'SN135792468',
      location: 'Lighting Storage',
      specifications: JSON.stringify({
        output: '720W LED',
        color_temp: '5600K',
        cri: '95+',
        weight: '4.2kg'
      })
    }
  ]);

  // Create equipment tags
  const tags = await knex('equipment_tags').insert([
    { name: '4K', slug: '4k', description: '4K resolution capable' },
    { name: 'Slow Motion', slug: 'slow-motion', description: 'High frame rate recording' },
    { name: 'Full Frame', slug: 'full-frame', description: 'Full frame sensor' },
    { name: 'LED', slug: 'led', description: 'LED lighting' },
    { name: 'Daylight', slug: 'daylight', description: '5600K color temperature' },
    { name: 'Wireless', slug: 'wireless', description: 'Wireless capability' }
  ]).returning('*');

  console.log('Seed completed: Equipment categories, vendors, and sample items created');
};
