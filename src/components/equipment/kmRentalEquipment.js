// Sample equipment data (50 items) for demo
// Full 1,328 catalog served via API

export const EQUIPMENT_CATEGORIES = [
  'Grip & Support',
  'Lighting',
  'Lenses',
  'Accessories',
  'Power',
  'Cameras',
  'Production',
  'Motion',
  'Sound',
  'Styling'
];

export const EQUIPMENT_DATA = [
  // GRIP & SUPPORT
  { id: 'grip-001', sku: '610630572577', name: 'A Clamp - Large', category: 'Grip & Support', kmPrice: 1.5, basePrice: 3.75, qty: 15, image: 'https://kmrentaleq.com/images/P/VD1428-1-02.JPG', description: 'Heavy duty A clamp for lighting and grip', type: 'partner', availability: 'In Stock' },
  { id: 'grip-002', sku: '920317392733', name: 'ALM Action Cart - Table Top Dolly', category: 'Grip & Support', kmPrice: 15, basePrice: 37.5, qty: 2, image: 'https://kmrentaleq.com/images/P/VD1000-1.jpg', description: 'Compact table top dolly for smooth camera moves', type: 'partner', availability: 'In Stock' },
  { id: 'grip-003', sku: '172394857293', name: 'C-Stand (Matte Black)', category: 'Grip & Support', kmPrice: 15, basePrice: 45, qty: 8, image: 'cstand', description: 'Heavy duty C-stand with grip head', type: 'in_house', availability: 'In Stock' },
  { id: 'grip-004', sku: '837460918273', name: 'Combo Stand - Junior', category: 'Grip & Support', kmPrice: 25, basePrice: 75, qty: 4, image: 'combo-stand', description: 'Junior combo stand with 40" riser', type: 'in_house', availability: 'In Stock' },
  { id: 'grip-005', sku: '564738291047', name: 'Sandbag - 25lb', category: 'Grip & Support', kmPrice: 8, basePrice: 25, qty: 20, image: 'sandbag', description: 'Black sandbag with handle', type: 'in_house', availability: 'In Stock' },
  
  // LIGHTING
  { id: 'light-001', sku: '125791292242', name: 'Aputure 1000C Storm Blair Monolight', category: 'Lighting', kmPrice: 350, basePrice: 875, qty: 2, image: 'https://kmrentaleq.com/images/P/1732017718_IMG_2374054.jpg', description: 'Full color RGBWW monolight', type: 'partner', availability: 'In Stock' },
  { id: 'light-002', sku: '987654321098', name: 'Aputure 600d Pro', category: 'Lighting', kmPrice: 75, basePrice: 195, qty: 3, image: '600d', description: 'High output daylight LED', type: 'in_house', availability: 'In Stock' },
  { id: 'light-003', sku: '456789012345', name: 'Aputure 300x', category: 'Lighting', kmPrice: 45, basePrice: 120, qty: 4, image: '300x', description: 'Bi-color LED with Bowens mount', type: 'in_house', availability: 'In Stock' },
  { id: 'light-004', sku: '234567890123', name: 'Light Dome II', category: 'Lighting', kmPrice: 25, basePrice: 65, qty: 3, image: 'dome', description: 'Large softbox for Aputure lights', type: 'in_house', availability: 'In Stock' },
  { id: 'light-005', sku: '876543210987', name: 'Lantern Softbox', category: 'Lighting', kmPrice: 20, basePrice: 55, qty: 4, image: 'lantern', description: '360-degree omni-directional soft light', type: 'in_house', availability: 'In Stock' },
  
  // CAMERAS
  { id: 'cam-001', sku: '345678901234', name: 'Sony FX6 Cinema Camera', category: 'Cameras', kmPrice: 350, basePrice: 875, qty: 2, image: 'fx6', description: 'Full-frame cinema camera with raw output', type: 'in_house', availability: 'In Stock' },
  { id: 'cam-002', sku: '567890123456', name: 'Sony FX3', category: 'Cameras', kmPrice: 150, basePrice: 375, qty: 3, image: 'fx3', description: 'Compact full-frame cinema camera', type: 'in_house', availability: 'In Stock' },
  { id: 'cam-003', sku: '789012345678', name: 'Sony A7S III', category: 'Cameras', kmPrice: 125, basePrice: 315, qty: 2, image: 'a7s3', description: 'Low light mirrorless camera', type: 'in_house', availability: 'In Stock' },
  { id: 'cam-004', sku: '901234567890', name: 'Canon C70', category: 'Cameras', kmPrice: 275, basePrice: 690, qty: 1, image: 'c70', description: 'RF mount cinema camera', type: 'in_house', availability: 'In Stock' },
  { id: 'cam-005', sku: '112233445566', name: 'RED Komodo 6K', category: 'Cameras', kmPrice: 400, basePrice: 1000, qty: 1, image: 'komodo', description: 'Compact RED camera with RF mount', type: 'partner', availability: 'Call for Availability' },
  
  // LENSES
  { id: 'lens-001', sku: '223344556677', name: 'Sony 24-70mm f/2.8 GM II', category: 'Lenses', kmPrice: 75, basePrice: 195, qty: 2, image: '2470gm2', description: 'Standard zoom for Sony E-mount', type: 'in_house', availability: 'In Stock' },
  { id: 'lens-002', sku: '334455667788', name: 'Sony 70-200mm f/2.8 GM OSS II', category: 'Lenses', kmPrice: 95, basePrice: 240, qty: 2, image: '70200gm2', description: 'Telephoto zoom for Sony E-mount', type: 'in_house', availability: 'In Stock' },
  { id: 'lens-003', sku: '445566778899', name: 'Sigma 35mm f/1.4 Art', category: 'Lenses', kmPrice: 45, basePrice: 115, qty: 2, image: '35art', description: 'Fast prime for Sony E-mount', type: 'in_house', availability: 'In Stock' },
  { id: 'lens-004', sku: '556677889900', name: 'Sigma 85mm f/1.4 Art', category: 'Lenses', kmPrice: 55, basePrice: 140, qty: 2, image: '85art', description: 'Portrait prime for Sony E-mount', type: 'in_house', availability: 'In Stock' },
  { id: 'lens-005', sku: '667788990011', name: 'Canon RF 28-70mm f/2L', category: 'Lenses', kmPrice: 85, basePrice: 215, qty: 1, image: '2870rf', description: 'Fast standard zoom for RF mount', type: 'partner', availability: 'Call for Availability' },
  
  // SOUND
  { id: 'sound-001', sku: '778899001122', name: 'Sennheiser MKH 416', category: 'Sound', kmPrice: 45, basePrice: 115, qty: 3, image: 'mkh416', description: 'Industry standard shotgun mic', type: 'in_house', availability: 'In Stock' },
  { id: 'sound-002', sku: '889900112233', name: 'Sennheiser EW 112P G4', category: 'Sound', kmPrice: 35, basePrice: 90, qty: 4, image: 'ew112', description: 'Wireless lavalier system', type: 'in_house', availability: 'In Stock' },
  { id: 'sound-003', sku: '990011223344', name: 'Zoom F6 Recorder', category: 'Sound', kmPrice: 55, basePrice: 140, qty: 2, image: 'f6', description: '6-channel field recorder', type: 'in_house', availability: 'In Stock' },
  { id: 'sound-004', sku: '001122334455', name: 'Sound Devices MixPre-6 II', category: 'Sound', kmPrice: 75, basePrice: 190, qty: 1, image: 'mixpre6', description: '8-track field recorder with USB', type: 'partner', availability: 'Call for Availability' },
  { id: 'sound-005', sku: '102938475610', name: 'Boom Pole - 10ft', category: 'Sound', kmPrice: 15, basePrice: 40, qty: 3, image: 'boom', description: 'Carbon fiber boom pole', type: 'in_house', availability: 'In Stock' },
  
  // PRODUCTION
  { id: 'prod-001', sku: '214365870921', name: 'Director\'s Chair', category: 'Production', kmPrice: 12, basePrice: 35, qty: 4, image: 'chair', description: 'Tall canvas director chair', type: 'in_house', availability: 'In Stock' },
  { id: 'prod-002', sku: '325476981032', name: 'Production Cart', category: 'Production', kmPrice: 35, basePrice: 90, qty: 2, image: 'cart', description: 'Inovativ Scout cart', type: 'in_house', availability: 'In Stock' },
  { id: 'prod-003', sku: '436587092143', name: 'Monitor - 17" Director\'s', category: 'Production', kmPrice: 85, basePrice: 215, qty: 2, image: 'monitor17', description: '17" 4K production monitor', type: 'in_house', availability: 'In Stock' },
  { id: 'prod-004', sku: '547698103254', name: 'Teradek Bolt 6 XT', category: 'Production', kmPrice: 150, basePrice: 375, qty: 1, image: 'bolt6', description: 'Wireless video transmission', type: 'partner', availability: 'Call for Availability' },
  { id: 'prod-005', sku: '658709214365', name: 'Video Village Setup', category: 'Production', kmPrice: 200, basePrice: 500, qty: 1, image: 'village', description: 'Complete director\'s monitor setup', type: 'in_house', availability: 'In Stock' },
  
  // MOTION
  { id: 'motion-001', sku: '769810325476', name: 'Dana Dolly', category: 'Motion', kmPrice: 95, basePrice: 240, qty: 1, image: 'dana', description: 'Portable camera dolly system', type: 'in_house', availability: 'In Stock' },
  { id: 'motion-002', sku: '870921436587', name: 'Ronin RS3 Pro', category: 'Motion', kmPrice: 55, basePrice: 140, qty: 3, image: 'rs3pro', description: '3-axis gimbal stabilizer', type: 'in_house', availability: 'In Stock' },
  { id: 'motion-003', sku: '981032547698', name: 'Slider - 3ft', category: 'Motion', kmPrice: 35, basePrice: 90, qty: 2, image: 'slider', description: 'Portable camera slider', type: 'in_house', availability: 'In Stock' },
  { id: 'motion-004', sku: '092143658709', name: 'Movi Pro', category: 'Motion', kmPrice: 125, basePrice: 315, qty: 1, image: 'movi', description: 'Professional 3-axis gimbal', type: 'partner', availability: 'Call for Availability' },
  { id: 'motion-005', sku: '103254769810', name: 'Technocrane 15ft', category: 'Motion', kmPrice: 850, basePrice: 2125, qty: 0, image: 'techno', description: 'Telescoping camera crane', type: 'partner', availability: 'Call for Availability' },
  
  // POWER
  { id: 'power-001', sku: '214365870912', name: 'V-Mount Battery 98Wh', category: 'Power', kmPrice: 25, basePrice: 65, qty: 12, image: 'vmount', description: 'High capacity V-mount battery', type: 'in_house', availability: 'In Stock' },
  { id: 'power-002', sku: '325476981023', name: 'V-Mount Battery 150Wh', category: 'Power', kmPrice: 35, basePrice: 90, qty: 8, image: 'vmount150', description: 'Extended capacity V-mount', type: 'in_house', availability: 'In Stock' },
  { id: 'power-003', sku: '436587092134', name: 'Dual V-Mount Charger', category: 'Power', kmPrice: 20, basePrice: 55, qty: 4, image: 'charger', description: 'Simultaneous dual charger', type: 'in_house', availability: 'In Stock' },
  { id: 'power-004', sku: '547698103245', name: 'Stinger - 25ft', category: 'Power', kmPrice: 8, basePrice: 25, qty: 15, image: 'stinger', description: '12/3 power extension', type: 'in_house', availability: 'In Stock' },
  { id: 'power-005', sku: '658709214356', name: 'Distro Box - 100A', category: 'Power', kmPrice: 85, basePrice: 215, qty: 2, image: 'distro', description: 'Power distribution with breakers', type: 'partner', availability: 'Call for Availability' },
  
  // ACCESSORIES
  { id: 'acc-001', sku: '769810325467', name: 'Tilta Nucleus-M', category: 'Accessories', kmPrice: 65, basePrice: 165, qty: 2, image: 'nucleus', description: 'Wireless follow focus', type: 'in_house', availability: 'In Stock' },
  { id: 'acc-002', sku: '870921436578', name: 'ND Filter Set - 4x5.65', category: 'Accessories', kmPrice: 45, basePrice: 115, qty: 3, image: 'ndset', description: 'Full ND set for matte box', type: 'in_house', availability: 'In Stock' },
  { id: 'acc-003', sku: '981032547689', name: 'Matte Box - 4x5.65', category: 'Accessories', kmPrice: 35, basePrice: 90, qty: 3, image: 'mattebox', description: 'Two-stage swing-away matte box', type: 'in_house', availability: 'In Stock' },
  { id: 'acc-004', sku: '092143658790', name: 'Monitor Cage - Atomos', category: 'Accessories', kmPrice: 15, basePrice: 40, qty: 4, image: 'cage', description: 'Protective cage for 7" monitor', type: 'in_house', availability: 'In Stock' },
  { id: 'acc-005', sku: '103254769801', name: 'SSD - 1TB Angelbird', category: 'Accessories', kmPrice: 45, basePrice: 115, qty: 6, image: 'ssd', description: 'CFast 2.0 for 4K raw recording', type: 'in_house', availability: 'In Stock' },
  
  // STYLING
  { id: 'style-001', sku: '214365870923', name: 'Steamer - Jiffy', category: 'Styling', kmPrice: 15, basePrice: 40, qty: 3, image: 'steamer', description: 'Garment steamer for wardrobe', type: 'in_house', availability: 'In Stock' },
  { id: 'style-002', sku: '325476981034', name: 'Rolling Rack', category: 'Styling', kmPrice: 12, basePrice: 35, qty: 6, image: 'rack', description: 'Collapsible wardrobe rack', type: 'in_house', availability: 'In Stock' },
  { id: 'style-003', sku: '436587092145', name: 'Clothing Rack - Double', category: 'Styling', kmPrice: 20, basePrice: 55, qty: 4, image: 'doublerack', description: 'Heavy duty double rail rack', type: 'in_house', availability: 'In Stock' },
  { id: 'style-004', sku: '547698103256', name: 'Hangers - Wooden (25pk)', category: 'Styling', kmPrice: 8, basePrice: 25, qty: 10, image: 'hangers', description: 'Wooden suit hangers', type: 'in_house', availability: 'In Stock' },
  { id: 'style-005', sku: '658709214367', name: 'Lint Roller Set', category: 'Styling', kmPrice: 5, basePrice: 15, qty: 15, image: 'lint', description: 'Professional lint removal kit', type: 'in_house', availability: 'In Stock' },
];

// Helper function to get day rate
export function getDayRate(equipment) {
  return equipment.basePrice || equipment.sellingPrice || 0;
}