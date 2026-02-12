// Equipment data based on KM Rental structure
// In-house equipment uses "sellingPrice" (cost + markup)
// Partner equipment (KM Rental) uses kmPrice × 2.5 (retail pricing with 60% discount)

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
  // GRIP & SUPPORT (In-house prioritized)
  {
    id: 'grip-001',
    name: 'C-Stands (Matte Black)',
    category: 'Grip & Support',
    kmPrice: 15,
    sellingPrice: 45,
    type: 'in_house',
    description: 'Heavy duty C-stand with grip head',
    availability: 'In Stock',
    image: 'cstand'
  },
  {
    id: 'grip-002',
    name: 'Combo Stand - Junior',
    category: 'Grip & Support',
    kmPrice: 25,
    sellingPrice: 75,
    type: 'in_house',
    description: 'Junior combo stand with 40" riser',
    availability: 'In Stock',
    image: 'combo-stand'
  },
  {
    id: 'grip-003',
    name: 'Sandbag - 25lb',
    category: 'Grip & Support',
    kmPrice: 8,
    sellingPrice: 25,
    type: 'in_house',
    description: 'Black sandbag with handle',
    availability: 'In Stock',
    image: 'sandbag'
  },
  {
    id: 'grip-004',
    name: 'Super Clamp',
    category: 'Grip & Support',
    kmPrice: 12,
    sellingPrice: 35,
    type: 'partner',
    description: 'Versatile grip clamp',
    availability: 'Available',
    image: 'clamp'
  },
  {
    id: 'grip-005',
    name: 'Flag Kit - 18x24',
    category: 'Grip & Support',
    kmPrice: 45,
    sellingPrice: 130,
    type: 'partner',
    description: 'Flag kit with single, double, silk',
    availability: 'Available',
    image: 'flag'
  },
  {
    id: 'grip-006',
    name: 'Apple Boxes - Full Set',
    category: 'Grip & Support',
    kmPrice: 35,
    sellingPrice: 100,
    type: 'in_house',
    description: 'Full, half, quarter, pancake',
    availability: 'Limited',
    image: 'applebox'
  },

  // LIGHTING (In-house prioritized)
  {
    id: 'light-001',
    name: 'Aputure 600d Pro',
    category: 'Lighting',
    kmPrice: 150,
    sellingPrice: 450,
    type: 'in_house',
    description: '600W daylight LED with Bowens mount',
    availability: 'In Stock',
    image: 'aputure-600'
  },
  {
    id: 'light-002',
    name: 'Aputure 300x',
    category: 'Lighting',
    kmPrice: 85,
    sellingPrice: 250,
    type: 'in_house',
    description: '300W bicolor LED',
    availability: 'In Stock',
    image: 'aputure-300'
  },
  {
    id: 'light-003',
    name: 'Aputure 120d II',
    category: 'Lighting',
    kmPrice: 55,
    sellingPrice: 165,
    type: 'in_house',
    description: '120W daylight LED',
    availability: 'In Stock',
    image: 'aputure-120'
  },
  {
    id: 'light-004',
    name: 'Light Dome III (35")',
    category: 'Lighting',
    kmPrice: 40,
    sellingPrice: 120,
    type: 'in_house',
    description: 'Large softbox for Aputure lights',
    availability: 'In Stock',
    image: 'dome'
  },
  {
    id: 'light-005',
    name: 'Light Dome Mini II',
    category: 'Lighting',
    kmPrice: 30,
    sellingPrice: 90,
    type: 'in_house',
    description: '21" softbox for portable setups',
    availability: 'Limited',
    image: 'dome-mini'
  },
  {
    id: 'light-006',
    name: 'Nanlite PavoTube II 30C (4-tube kit)',
    category: 'Lighting',
    kmPrice: 120,
    sellingPrice: 360,
    type: 'partner',
    description: 'RGB tube lights with batteries',
    availability: 'Available',
    image: 'pavotube'
  },
  {
    id: 'light-007',
    name: 'Astera Titan Tube (8-tube kit)',
    category: 'Lighting',
    kmPrice: 450,
    sellingPrice: 1350,
    type: 'partner',
    description: 'Premium RGB pixel tubes',
    availability: 'Available',
    image: 'astera'
  },
  {
    id: 'light-008',
    name: 'Skypanel S60-C',
    category: 'Lighting',
    kmPrice: 650,
    sellingPrice: 1950,
    type: 'partner',
    description: 'Large soft panel RGB',
    availability: 'Limited',
    image: 'skypanel'
  },

  // LENSES (Partner - high value items)
  {
    id: 'lens-001',
    name: 'Canon RF 24-70mm f/2.8L',
    category: 'Lenses',
    kmPrice: 120,
    sellingPrice: 350,
    type: 'in_house',
    description: 'Standard zoom for R-series',
    availability: 'In Stock',
    image: 'rf-24-70'
  },
  {
    id: 'lens-002',
    name: 'Canon RF 70-200mm f/2.8L',
    category: 'Lenses',
    kmPrice: 150,
    sellingPrice: 450,
    type: 'in_house',
    description: 'Telephoto zoom for R-series',
    availability: 'In Stock',
    image: 'rf-70-200'
  },
  {
    id: 'lens-003',
    name: 'Sigma Cine 18-35mm T2',
    category: 'Lenses',
    kmPrice: 180,
    sellingPrice: 540,
    type: 'partner',
    description: 'Super35 cine zoom EF mount',
    availability: 'Available',
    image: 'sigma-cine'
  },
  {
    id: 'lens-004',
    name: 'Sigma Cine 50-100mm T2',
    category: 'Lenses',
    kmPrice: 180,
    sellingPrice: 540,
    type: 'partner',
    description: 'Super35 cine zoom EF mount',
    availability: 'Available',
    image: 'sigma-cine'
  },
  {
    id: 'lens-005',
    name: 'Canon CN-E 35mm T1.5',
    category: 'Lenses',
    kmPrice: 250,
    sellingPrice: 750,
    type: 'partner',
    description: 'Full frame cinema prime EF',
    availability: 'Limited',
    image: 'cne-prime'
  },
  {
    id: 'lens-006',
    name: 'Canon CN-E 50mm T1.3',
    category: 'Lenses',
    kmPrice: 250,
    sellingPrice: 750,
    type: 'partner',
    description: 'Full frame cinema prime EF',
    availability: 'Limited',
    image: 'cne-prime'
  },
  {
    id: 'lens-007',
    name: 'DZO Film Vespid Prime Set (5pc)',
    category: 'Lenses',
    kmPrice: 450,
    sellingPrice: 1350,
    type: 'partner',
    description: 'Full frame cinema primes PL/EF',
    availability: 'Available',
    image: 'vespid'
  },

  // CAMERAS
  {
    id: 'cam-001',
    name: 'Canon R5C',
    category: 'Cameras',
    kmPrice: 350,
    sellingPrice: 1050,
    type: 'in_house',
    description: '8K cinema camera hybrid',
    availability: 'In Stock',
    image: 'r5c'
  },
  {
    id: 'cam-002',
    name: 'Canon R5',
    category: 'Cameras',
    kmPrice: 250,
    sellingPrice: 750,
    type: 'in_house',
    description: '45MP hybrid mirrorless',
    availability: 'In Stock',
    image: 'r5'
  },
  {
    id: 'cam-003',
    name: 'Canon C70',
    category: 'Cameras',
    kmPrice: 450,
    sellingPrice: 1350,
    type: 'in_house',
    description: 'Cinema EOS Super35',
    availability: 'Limited',
    image: 'c70'
  },
  {
    id: 'cam-004',
    name: 'RED Komodo 6K',
    category: 'Cameras',
    kmPrice: 550,
    sellingPrice: 1650,
    type: 'partner',
    description: 'Compact 6K S35 camera RF mount',
    availability: 'Available',
    image: 'komodo'
  },
  {
    id: 'cam-005',
    name: 'Sony FX6',
    category: 'Cameras',
    kmPrice: 450,
    sellingPrice: 1350,
    type: 'partner',
    description: 'Full frame cinema camera',
    availability: 'Available',
    image: 'fx6'
  },
  {
    id: 'cam-006',
    name: 'DJI Ronin 4D 6K',
    category: 'Cameras',
    kmPrice: 650,
    sellingPrice: 1950,
    type: 'partner',
    description: '4-axis stabilized cinema camera',
    availability: 'Limited',
    image: 'ronin-4d'
  },

  // MOTION
  {
    id: 'motion-001',
    name: 'DJI RS3 Pro',
    category: 'Motion',
    kmPrice: 120,
    sellingPrice: 360,
    type: 'in_house',
    description: 'Professional gimbal stabilizer',
    availability: 'In Stock',
    image: 'rs3-pro'
  },
  {
    id: 'motion-002',
    name: 'DJI RS3',
    category: 'Motion',
    kmPrice: 80,
    sellingPrice: 240,
    type: 'in_house',
    description: 'Compact gimbal stabilizer',
    availability: 'In Stock',
    image: 'rs3'
  },
  {
    id: 'motion-003',
    name: 'Dana Dolly Kit',
    category: 'Motion',
    kmPrice: 150,
    sellingPrice: 450,
    type: 'in_house',
    description: 'Portable dolly with track',
    availability: 'In Stock',
    image: 'dana-dolly'
  },
  {
    id: 'motion-004',
    name: 'Ronin 2',
    category: 'Motion',
    kmPrice: 350,
    sellingPrice: 1050,
    type: 'partner',
    description: 'Heavy duty gimbal for cinema cameras',
    availability: 'Available',
    image: 'ronin-2'
  },
  {
    id: 'motion-005',
    name: 'Kessler Crane - 8ft',
    category: 'Motion',
    kmPrice: 280,
    sellingPrice: 840,
    type: 'partner',
    description: 'Portable jib crane',
    availability: 'Limited',
    image: 'jib'
  },

  // SOUND
  {
    id: 'sound-001',
    name: 'Sennheiser MKH 416',
    category: 'Sound',
    kmPrice: 85,
    sellingPrice: 255,
    type: 'in_house',
    description: 'Shotgun mic industry standard',
    availability: 'In Stock',
    image: 'mkh416'
  },
  {
    id: 'sound-002',
    name: 'Zoom F6',
    category: 'Sound',
    kmPrice: 120,
    sellingPrice: 360,
    type: 'in_house',
    description: '6-track field recorder',
    availability: 'In Stock',
    image: 'f6'
  },
  {
    id: 'sound-003',
    name: 'Sennheiser Wireless G4 (2ch)',
    category: 'Sound',
    kmPrice: 150,
    sellingPrice: 450,
    type: 'in_house',
    description: 'Wireless lav kit dual channel',
    availability: 'Limited',
    image: 'g4'
  },
  {
    id: 'sound-004',
    name: 'Deity S-Mic 2',
    category: 'Sound',
    kmPrice: 45,
    sellingPrice: 135,
    type: 'in_house',
    description: 'Shotgun microphone',
    availability: 'In Stock',
    image: 'smic2'
  },
  {
    id: 'sound-005',
    name: 'Sound Devices MixPre-6',
    category: 'Sound',
    kmPrice: 140,
    sellingPrice: 420,
    type: 'partner',
    description: '6-track recorder with USB',
    availability: 'Available',
    image: 'mixpre'
  },

  // PRODUCTION
  {
    id: 'prod-001',
    name: 'Atomos Ninja V+',
    category: 'Production',
    kmPrice: 120,
    sellingPrice: 360,
    type: 'in_house',
    description: '5" 8K ProRes/DNx recorder',
    availability: 'In Stock',
    image: 'ninja'
  },
  {
    id: 'prod-002',
    name: 'Teradek Bolt 4K LT (TX/RX)',
    category: 'Production',
    kmPrice: 350,
    sellingPrice: 1050,
    type: 'in_house',
    description: 'Wireless video transmission',
    availability: 'Limited',
    image: 'teradek'
  },
  {
    id: 'prod-003',
    name: 'SmallHD Cine 7',
    category: 'Production',
    kmPrice: 180,
    sellingPrice: 540,
    type: 'in_house',
    description: '7" on-camera monitor',
    availability: 'In Stock',
    image: 'cine7'
  },
  {
    id: 'prod-004',
    name: 'Director\'s Monitor Cart',
    category: 'Production',
    kmPrice: 250,
    sellingPrice: 750,
    type: 'in_house',
    description: '17" monitor with cart and wireless',
    availability: 'Limited',
    image: 'directors-monitor'
  },

  // POWER
  {
    id: 'power-001',
    name: 'V-Mount Battery 150Wh',
    category: 'Power',
    kmPrice: 35,
    sellingPrice: 105,
    type: 'in_house',
    description: 'High capacity V-mount battery',
    availability: 'In Stock',
    image: 'v-mount'
  },
  {
    id: 'power-002',
    name: 'V-Mount Quad Charger',
    category: 'Power',
    kmPrice: 45,
    sellingPrice: 135,
    type: 'in_house',
    description: '4-channel battery charger',
    availability: 'In Stock',
    image: 'charger'
  },
  {
    id: 'power-003',
    name: 'Stinger - 25ft',
    category: 'Power',
    kmPrice: 15,
    sellingPrice: 45,
    type: 'in_house',
    description: 'Extension cord heavy duty',
    availability: 'In Stock',
    image: 'stinger'
  },
  {
    id: 'power-004',
    name: 'Power Distro Box',
    category: 'Power',
    kmPrice: 85,
    sellingPrice: 255,
    type: 'partner',
    description: '100A distribution with breakers',
    availability: 'Available',
    image: 'distro'
  },

  // ACCESSORIES
  {
    id: 'acc-001',
    name: 'CFexpress Type B 512GB',
    category: 'Accessories',
    kmPrice: 65,
    sellingPrice: 195,
    type: 'in_house',
    description: 'High speed memory card',
    availability: 'In Stock',
    image: 'cfe'
  },
  {
    id: 'acc-002',
    name: 'SDXC UHS-II 128GB',
    category: 'Accessories',
    kmPrice: 25,
    sellingPrice: 75,
    type: 'in_house',
    description: 'SD card high speed',
    availability: 'In Stock',
    image: 'sd'
  },
  {
    id: 'acc-003',
    name: 'Card Reader - CFexpress/SD',
    category: 'Accessories',
    kmPrice: 20,
    sellingPrice: 60,
    type: 'in_house',
    description: 'USB-C card reader',
    availability: 'In Stock',
    image: 'reader'
  },
  {
    id: 'acc-004',
    name: 'Wireless HDMI Transmitter',
    category: 'Accessories',
    kmPrice: 85,
    sellingPrice: 255,
    type: 'partner',
    description: 'Consumer wireless video',
    availability: 'Available',
    image: 'wireless-hdmi'
  },

  // STYLING
  {
    id: 'style-001',
    name: '9x12 Chroma Green Screen',
    category: 'Styling',
    kmPrice: 120,
    sellingPrice: 360,
    type: 'in_house',
    description: 'Foldable green screen with stand',
    availability: 'In Stock',
    image: 'green-screen'
  },
  {
    id: 'style-002',
    name: '8x8 Butterfly Frame Kit',
    category: 'Styling',
    kmPrice: 180,
    sellingPrice: 540,
    type: 'in_house',
    description: 'Frame with silk, ultrabounce, solid',
    availability: 'Limited',
    image: 'butterfly'
  },
  {
    id: 'style-003',
    name: '12x12 Ultrabounce',
    category: 'Styling',
    kmPrice: 95,
    sellingPrice: 285,
    type: 'partner',
    description: 'Large bounce fabric with frame',
    availability: 'Available',
    image: 'ultrabounce'
  },
  {
    id: 'style-004',
    name: '8x8 Grid Cloth',
    category: 'Styling',
    kmPrice: 75,
    sellingPrice: 225,
    type: 'partner',
    description: 'Silk diffusion cloth with frame',
    availability: 'Available',
    image: 'grid'
  }
];

// Helper function to calculate retail price for partner equipment
// Partner equipment: KM PRICE × 2.5 (60% discount means cost is 40%, retail is 250%)
export const getPartnerRetailPrice = (kmPrice) => kmPrice * 2.5;

// Helper function to get the correct day rate based on equipment type
export const getDayRate = (equipment) => {
  if (equipment.type === 'partner') {
    return getPartnerRetailPrice(equipment.kmPrice);
  }
  return equipment.sellingPrice;
};

// Sample existing bookings for calendar
export const EXISTING_BOOKINGS = [
  { id: 1, date: '2026-02-15', client: 'Nike Production', type: 'studio', status: 'confirmed' },
  { id: 2, date: '2026-02-16', client: 'HBO Documentary', type: 'studio', status: 'confirmed' },
  { id: 3, date: '2026-02-20', client: 'Spotify', type: 'studio', status: 'pending' },
  { id: 4, date: '2026-02-22', client: 'Meta', type: 'studio', status: 'confirmed' },
  { id: 5, date: '2026-02-25', client: 'Netflix', type: 'studio', status: 'pending' },
  { id: 6, date: '2026-03-01', client: 'Apple', type: 'studio', status: 'confirmed' },
  { id: 7, date: '2026-03-05', client: 'Amazon', type: 'studio', status: 'confirmed' },
  { id: 8, date: '2026-03-10', client: 'Google', type: 'studio', status: 'pending' },
];

// Sample quote requests for admin
export const SAMPLE_QUOTES = [
  {
    id: 'Q-2026-001',
    clientName: 'Sarah Johnson',
    company: 'Creative Productions LLC',
    email: 'sarah@creativeprod.com',
    phone: '555-0123',
    createdAt: '2026-02-10T14:30:00Z',
    status: 'pending',
    serviceType: 'both',
    studioDate: '2026-02-28',
    studioTime: { start: '07:00', end: '19:00' },
    studioOverride: false,
    equipment: [
      { id: 'light-001', quantity: 2, days: 1 },
      { id: 'cam-001', quantity: 1, days: 1 },
      { id: 'grip-001', quantity: 4, days: 1 },
    ],
    coiUploaded: true,
    contractSigned: true,
    deliveryCost: 150,
    subtotal: 5100,
    tax: 452.63,
    total: 5552.63,
    depositType: '50%'
  },
  {
    id: 'Q-2026-002',
    clientName: 'Michael Chen',
    company: 'Chen Media',
    email: 'mike@chenmedia.com',
    phone: '555-0456',
    createdAt: '2026-02-11T09:15:00Z',
    status: 'pending',
    serviceType: 'equipment',
    studioDate: null,
    equipment: [
      { id: 'cam-004', quantity: 1, days: 3 },
      { id: 'lens-007', quantity: 1, days: 3 },
      { id: 'motion-004', quantity: 1, days: 3 },
    ],
    coiUploaded: false,
    contractSigned: false,
    deliveryCost: 0,
    subtotal: 12150,
    tax: 1078.31,
    total: 13228.31,
    depositType: '100%'
  },
  {
    id: 'Q-2026-003',
    clientName: 'Emma Rodriguez',
    company: 'Studio R',
    email: 'emma@studior.com',
    phone: '555-0789',
    createdAt: '2026-02-09T16:45:00Z',
    status: 'approved',
    serviceType: 'studio',
    studioDate: '2026-02-18',
    studioTime: { start: '07:00', end: '19:00' },
    studioOverride: false,
    equipment: [],
    coiUploaded: true,
    contractSigned: true,
    deliveryCost: 0,
    subtotal: 3000,
    tax: 266.25,
    total: 3266.25,
    depositType: '50%'
  },
  {
    id: 'Q-2026-004',
    clientName: 'David Park',
    company: 'Park Productions',
    email: 'david@parkprod.com',
    phone: '555-0321',
    createdAt: '2026-02-11T11:00:00Z',
    status: 'pending',
    serviceType: 'both',
    studioDate: '2026-03-15',
    studioTime: { start: '09:00', end: '17:00' },
    studioOverride: true,
    equipment: [
      { id: 'light-006', quantity: 4, days: 2 },
      { id: 'sound-005', quantity: 1, days: 2 },
      { id: 'prod-004', quantity: 1, days: 2 },
    ],
    coiUploaded: true,
    contractSigned: false,
    deliveryCost: 200,
    subtotal: 6200,
    tax: 550.25,
    total: 6950.25,
    depositType: '50%'
  },
  {
    id: 'Q-2026-005',
    clientName: 'Lisa Thompson',
    company: 'Indie Films',
    email: 'lisa@indiefilms.com',
    phone: '555-0654',
    createdAt: '2026-02-08T10:30:00Z',
    status: 'declined',
    serviceType: 'equipment',
    studioDate: null,
    equipment: [
      { id: 'cam-006', quantity: 1, days: 5 },
    ],
    coiUploaded: false,
    contractSigned: false,
    deliveryCost: 300,
    subtotal: 10050,
    tax: 891.94,
    total: 11241.94,
    depositType: '100%'
  }
];

export default {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_DATA,
  EXISTING_BOOKINGS,
  SAMPLE_QUOTES,
  getPartnerRetailPrice,
  getDayRate
};