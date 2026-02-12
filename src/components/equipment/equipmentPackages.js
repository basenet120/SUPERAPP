// Equipment Packages/Bundles - Pre-configured kits for common productions
export const EQUIPMENT_PACKAGES = [
  {
    id: 'pkg-documentary',
    name: 'Documentary Kit',
    description: 'Complete run-and-gun documentary setup with versatile lighting and audio',
    category: 'Packages',
    image: '🎬',
    basePrice: 850,
    items: [
      { id: 'cam-002', quantity: 1, name: 'Canon R5' },
      { id: 'lens-001', quantity: 1, name: 'Canon RF 24-70mm f/2.8L' },
      { id: 'sound-001', quantity: 1, name: 'Sennheiser MKH 416' },
      { id: 'sound-003', quantity: 1, name: 'Sennheiser Wireless G4 (2ch)' },
      { id: 'light-003', quantity: 2, name: 'Aputure 120d II' },
      { id: 'light-004', quantity: 2, name: 'Light Dome III (35")' },
      { id: 'motion-002', quantity: 1, name: 'DJI RS3' },
      { id: 'grip-001', quantity: 2, name: 'C-Stands (Matte Black)' },
      { id: 'power-001', quantity: 4, name: 'V-Mount Battery 150Wh' },
    ],
    savings: 245,
    popular: true,
    idealFor: ['Interviews', 'B-Roll', 'Corporate', 'Events'],
    setupTime: '30 min'
  },
  {
    id: 'pkg-podcast',
    name: 'Podcast Setup',
    description: 'Professional podcast studio in a box - 2 person setup with lighting',
    category: 'Packages',
    image: '🎙️',
    basePrice: 520,
    items: [
      { id: 'cam-003', quantity: 2, name: 'Canon C70' },
      { id: 'lens-001', quantity: 2, name: 'Canon RF 24-70mm f/2.8L' },
      { id: 'sound-003', quantity: 2, name: 'Sennheiser Wireless G4 (2ch)' },
      { id: 'light-002', quantity: 3, name: 'Aputure 300x' },
      { id: 'light-005', quantity: 3, name: 'Light Dome Mini II' },
      { id: 'grip-001', quantity: 3, name: 'C-Stands (Matte Black)' },
      { id: 'style-001', quantity: 1, name: '9x12 Chroma Green Screen' },
      { id: 'prod-001', quantity: 2, name: 'Atomos Ninja V+' },
    ],
    savings: 380,
    popular: true,
    idealFor: ['Podcasts', 'Interviews', 'YouTube', 'Live Streaming'],
    setupTime: '45 min'
  },
  {
    id: 'pkg-cinema',
    name: 'Cinema Package',
    description: 'High-end cinema production kit with cinema cameras and glass',
    category: 'Packages',
    image: '🎥',
    basePrice: 2850,
    items: [
      { id: 'cam-004', quantity: 1, name: 'RED Komodo 6K' },
      { id: 'lens-007', quantity: 1, name: 'DZO Film Vespid Prime Set (5pc)' },
      { id: 'motion-004', quantity: 1, name: 'Ronin 2' },
      { id: 'sound-005', quantity: 1, name: 'Sound Devices MixPre-6' },
      { id: 'sound-001', quantity: 1, name: 'Sennheiser MKH 416' },
      { id: 'light-001', quantity: 3, name: 'Aputure 600d Pro' },
      { id: 'light-004', quantity: 3, name: 'Light Dome III (35")' },
      { id: 'prod-001', quantity: 1, name: 'Atomos Ninja V+' },
      { id: 'grip-001', quantity: 4, name: 'C-Stands (Matte Black)' },
      { id: 'grip-002', quantity: 2, name: 'Combo Stand - Junior' },
    ],
    savings: 650,
    popular: false,
    idealFor: ['Commercials', 'Music Videos', 'Short Films', 'Brand Content'],
    setupTime: '90 min'
  },
  {
    id: 'pkg-interview',
    name: 'Interview Kit',
    description: 'Streamlined 2-camera interview setup with professional lighting',
    category: 'Packages',
    image: '🎤',
    basePrice: 680,
    items: [
      { id: 'cam-002', quantity: 2, name: 'Canon R5' },
      { id: 'lens-001', quantity: 1, name: 'Canon RF 24-70mm f/2.8L' },
      { id: 'lens-002', quantity: 1, name: 'Canon RF 70-200mm f/2.8L' },
      { id: 'sound-001', quantity: 1, name: 'Sennheiser MKH 416' },
      { id: 'sound-003', quantity: 1, name: 'Sennheiser Wireless G4 (2ch)' },
      { id: 'light-001', quantity: 1, name: 'Aputure 600d Pro' },
      { id: 'light-002', quantity: 2, name: 'Aputure 300x' },
      { id: 'light-004', quantity: 2, name: 'Light Dome III (35")' },
      { id: 'light-005', quantity: 1, name: 'Light Dome Mini II' },
      { id: 'grip-001', quantity: 3, name: 'C-Stands (Matte Black)' },
      { id: 'style-002', quantity: 1, name: '8x8 Butterfly Frame Kit' },
    ],
    savings: 420,
    popular: true,
    idealFor: ['Corporate Interviews', 'Testimonials', 'Documentary', 'Press'],
    setupTime: '60 min'
  },
  {
    id: 'pkg-livestream',
    name: 'Live Stream Package',
    description: 'Multi-camera live streaming setup with switching and recording',
    category: 'Packages',
    image: '📡',
    basePrice: 1450,
    items: [
      { id: 'cam-003', quantity: 3, name: 'Canon C70' },
      { id: 'lens-001', quantity: 3, name: 'Canon RF 24-70mm f/2.8L' },
      { id: 'sound-003', quantity: 2, name: 'Sennheiser Wireless G4 (2ch)' },
      { id: 'sound-002', quantity: 1, name: 'Zoom F6' },
      { id: 'light-006', quantity: 4, name: 'Nanlite PavoTube II 30C (4-tube kit)' },
      { id: 'prod-002', quantity: 1, name: 'Teradek Bolt 4K LT (TX/RX)' },
      { id: 'prod-004', quantity: 1, name: 'Director\'s Monitor Cart' },
      { id: 'motion-001', quantity: 1, name: 'DJI RS3 Pro' },
      { id: 'power-001', quantity: 6, name: 'V-Mount Battery 150Wh' },
    ],
    savings: 580,
    popular: false,
    idealFor: ['Live Events', 'Webinars', 'Conferences', 'Concerts'],
    setupTime: '120 min'
  },
  {
    id: 'pkg-grip',
    name: 'Grip & Lighting Kit',
    description: 'Essential grip and lighting support for any production',
    category: 'Packages',
    image: '🔧',
    basePrice: 450,
    items: [
      { id: 'grip-001', quantity: 6, name: 'C-Stands (Matte Black)' },
      { id: 'grip-002', quantity: 2, name: 'Combo Stand - Junior' },
      { id: 'grip-003', quantity: 8, name: 'Sandbag - 25lb' },
      { id: 'grip-005', quantity: 1, name: 'Flag Kit - 18x24' },
      { id: 'grip-006', quantity: 1, name: 'Apple Boxes - Full Set' },
      { id: 'light-001', quantity: 2, name: 'Aputure 600d Pro' },
      { id: 'light-004', quantity: 2, name: 'Light Dome III (35")' },
      { id: 'style-002', quantity: 1, name: '8x8 Butterfly Frame Kit' },
      { id: 'power-003', quantity: 4, name: 'Stinger - 25ft' },
    ],
    savings: 280,
    popular: false,
    idealFor: ['Studio Shoots', 'Location Work', 'Commercials', 'Interviews'],
    setupTime: '45 min'
  }
];

// Equipment specifications database
export const EQUIPMENT_SPECS = {
  'cam-001': {
    sensor: '45MP Full Frame CMOS',
    resolution: '8K up to 60fps, 4K up to 120fps',
    mount: 'Canon RF',
    weight: '770g (body only)',
    features: ['Dual Pixel CMOS AF II', 'Canon Log 3', 'RAW Internal Recording', 'Active Cooling'],
    includes: ['Body', 'Battery', 'Charger', 'CFexpress Type B 512GB', 'Card Reader'],
    dimensions: '142 x 101 x 111 mm',
    power: 'LP-E6NH Battery, USB-C PD',
    connectivity: ['Full Size HDMI', 'USB-C', '3.5mm Audio In/Out', 'Timecode'],
    imageUrl: '/equipment/canon-r5c.jpg'
  },
  'cam-002': {
    sensor: '45MP Full Frame CMOS',
    resolution: '8K up to 30fps, 4K up to 120fps',
    mount: 'Canon RF',
    weight: '738g (body only)',
    features: ['Dual Pixel CMOS AF II', 'Canon Log', '8K RAW', 'IBIS'],
    includes: ['Body', 'Battery', 'Charger', 'CFexpress Type B 512GB', 'Card Reader'],
    dimensions: '138 x 98 x 88 mm',
    power: 'LP-E6NH Battery, USB-C PD',
    connectivity: ['Micro HDMI', 'USB-C', '3.5mm Audio In/Out', 'WiFi 6'],
    imageUrl: '/equipment/canon-r5.jpg'
  },
  'cam-003': {
    sensor: 'Super 35mm DGO CMOS',
    resolution: '4K up to 120fps',
    mount: 'Canon RF / EF (with adapter)',
    weight: '1,310g (body only)',
    features: ['16+ Stops DR', 'Canon Log 2/3', 'Dual Gain Output', 'Built-in ND (10-stop)'],
    includes: ['Body', 'Battery', 'Charger', 'RF to EF Adapter', 'Handle', '2x CFexpress 512GB'],
    dimensions: '160 x 130 x 116 mm',
    power: 'BP-A30 Battery, D-Tap, USB-C PD',
    connectivity: ['Full Size HDMI', 'SDI Out', 'Timecode', 'XLR Inputs (2x)'],
    imageUrl: '/equipment/canon-c70.jpg'
  },
  'cam-004': {
    sensor: 'Super 35mm 6K Global Shutter',
    resolution: '6K up to 40fps, 4K up to 60fps',
    mount: 'Canon RF / PL (with adapter)',
    weight: '950g (body only)',
    features: ['Global Shutter', 'RED RAW', 'Phase Detect AF', 'R3D Codec'],
    includes: ['Body', '2x Canon BP-955', 'Charger', 'RF to PL Adapter', '2x CFexpress 512GB'],
    dimensions: '129 x 95 x 109 mm',
    power: 'Canon BP Series, DC In',
    connectivity: ['Micro HDMI', 'USB-C', 'Audio In (3.5mm)', 'CTRL (RS)'],
    imageUrl: '/equipment/red-komodo.jpg'
  },
  'light-001': {
    output: '720W Equivalent',
    colorTemp: '5600K Daylight',
    cri: 'CRI 95+, TLCI 96+',
    dimming: '0-100% Continuous',
    mount: 'Bowens Mount',
    weight: '4.2kg (head only)',
    features: ['Sidus Link App Control', '9 Built-in FX', 'Wireless DMX', 'Weather Resistant'],
    includes: ['Light Head', 'Reflector', 'Power Cable', 'Carrying Case'],
    dimensions: '340 x 220 x 180 mm',
    power: 'AC 100-240V, V-Mount Battery',
    connectivity: ['DMX512', 'Bluetooth', '2.4GHz Wireless'],
    imageUrl: '/equipment/aputure-600d.jpg'
  },
  'light-002': {
    output: '350W Equivalent',
    colorTemp: '2700K-6500K Bi-Color',
    cri: 'CRI 96+, TLCI 96+',
    dimming: '0-100% Continuous',
    mount: 'Bowens Mount',
    weight: '1.9kg (head only)',
    features: ['Sidus Link App Control', '15 FX Effects', 'Quiet Fan Mode'],
    includes: ['Light Head', 'Reflector', 'Power Cable', 'Carrying Case'],
    dimensions: '280 x 180 x 140 mm',
    power: 'AC 100-240V, V-Mount Battery',
    connectivity: ['Bluetooth', '2.4GHz Wireless'],
    imageUrl: '/equipment/aputure-300x.jpg'
  },
  'light-003': {
    output: '120W Equivalent',
    colorTemp: '5500K Daylight',
    cri: 'CRI 96+, TLCI 97+',
    dimming: '0-100% Continuous',
    mount: 'Bowens Mount',
    weight: '1.4kg (head only)',
    features: ['Sidus Link App Control', '8 FX Effects', 'Ultra Quiet'],
    includes: ['Light Head', 'Reflector', 'Power Cable', 'Carrying Case'],
    dimensions: '220 x 150 x 120 mm',
    power: 'AC 100-240V, V-Mount Battery',
    connectivity: ['Bluetooth', '2.4GHz Wireless'],
    imageUrl: '/equipment/aputure-120d.jpg'
  },
  'lens-001': {
    mount: 'Canon RF',
    focalLength: '24-70mm',
    aperture: 'f/2.8 constant',
    elements: '21 elements in 15 groups',
    weight: '900g',
    features: ['Nano USM AF', '5-stop IS', 'Weather Sealed', 'Air Sphere Coating'],
    includes: ['Lens', 'Front/Rear Caps', 'Lens Hood', 'Case'],
    dimensions: '88 x 126 mm',
    filterSize: '82mm',
    minFocus: '0.21m (wide), 0.38m (tele)',
    imageStabilization: 'Yes, 5-stop',
    imageUrl: '/equipment/rf-24-70.jpg'
  },
  'lens-002': {
    mount: 'Canon RF',
    focalLength: '70-200mm',
    aperture: 'f/2.8 constant',
    elements: '17 elements in 13 groups',
    weight: '1,070g',
    features: ['Dual Nano USM', '5-stop IS', 'Weather Sealed', 'Telescoping Design'],
    includes: ['Lens', 'Front/Rear Caps', 'Lens Hood', 'Case', 'Tripod Mount'],
    dimensions: '90 x 146 mm (collapsed)',
    filterSize: '77mm',
    minFocus: '0.7m',
    imageStabilization: 'Yes, 5-stop',
    imageUrl: '/equipment/rf-70-200.jpg'
  },
  'motion-001': {
    payload: '4.5kg',
    weight: '1.5kg',
    batteryLife: '12 hours',
    features: ['ActiveTrack Pro', 'LiDAR Focusing', 'SuperSmooth', 'Wireless Transmitter'],
    includes: ['Gimbal', 'Briefcase Handle', 'Battery Grip', 'Carrying Case'],
    dimensions: '277 x 182 x 74 mm',
    connectivity: ['Bluetooth', '2.4GHz', 'USB-C'],
    stabilization: '3-axis',
    imageUrl: '/equipment/rs3-pro.jpg'
  },
  'motion-002': {
    payload: '3.0kg',
    weight: '990g',
    batteryLife: '12 hours',
    features: ['ActiveTrack 5.0', 'Automated Axis Locks', 'OLED Display'],
    includes: ['Gimbal', 'Quick Release Plate', 'Battery Grip', 'Carrying Case'],
    dimensions: '254 x 230 x 72 mm',
    connectivity: ['Bluetooth', 'USB-C'],
    stabilization: '3-axis',
    imageUrl: '/equipment/rs3.jpg'
  },
  'sound-001': {
    type: 'Shotgun Microphone',
    pattern: 'Supercardioid',
    frequency: '40Hz - 20kHz',
    sensitivity: '25 mV/Pa',
    weight: '175g',
    features: ['RF Condenser', 'Low Self Noise', 'High SPL Handling', 'Moisture Resistant'],
    includes: ['Mic', 'Shock Mount', 'Windscreen', 'XLR Cable', 'Case'],
    dimensions: '250 x 19 mm',
    power: '48V Phantom Power',
    connectivity: ['XLR 3-pin'],
    imageUrl: '/equipment/mkh416.jpg'
  },
  'sound-003': {
    type: 'Wireless Lavalier System',
    frequency: 'A1 Band (470-516 MHz)',
    range: '100m',
    batteryLife: '8 hours',
    weight: 'Receiver: 160g, Transmitter: 160g',
    features: ['True Diversity', 'HDX Companding', 'Rugged Metal Housing'],
    includes: ['2x Transmitter', 'Receiver', '2x Lav Mics', 'XLR Cable', 'Case'],
    dimensions: 'Receiver: 82 x 64 x 24 mm',
    power: 'AA Batteries',
    connectivity: ['XLR Out', '3.5mm Out'],
    imageUrl: '/equipment/g4.jpg'
  }
};

// Default specs for items without detailed specs
export const getDefaultSpecs = (equipment) => ({
  description: equipment.description,
  category: equipment.category,
  type: equipment.type === 'in_house' ? 'In-House Inventory' : 'Partner Equipment (KM Rental)',
  availability: equipment.availability,
  dayRate: equipment.type === 'partner' ? equipment.kmPrice * 2.5 : equipment.sellingPrice,
  partnerRate: equipment.type === 'partner' ? equipment.kmPrice : null,
  imageUrl: '/equipment/placeholder.jpg'
});

// Equipment availability calendar data
export const EQUIPMENT_AVAILABILITY = {
  // Format: 'YYYY-MM-DD': { available: number, total: number, bookings: [] }
};

// Generate mock availability for the next 90 days
export const generateAvailabilityData = () => {
  const data = {};
  const today = new Date();
  
  EQUIPMENT_DATA.forEach(equipment => {
    data[equipment.id] = {};
    
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Random availability (mostly available)
      const rand = Math.random();
      let available, total = equipment.type === 'in_house' ? 5 : 3;
      
      if (rand > 0.85) {
        available = 0; // Fully booked
      } else if (rand > 0.7) {
        available = Math.floor(total * 0.5); // Limited
      } else {
        available = total;
      }
      
      data[equipment.id][dateStr] = {
        available,
        total,
        status: available === 0 ? 'booked' : available < total ? 'limited' : 'available'
      };
    }
  });
  
  return data;
};

import { EQUIPMENT_DATA } from '../booking/equipmentData';

export default {
  EQUIPMENT_PACKAGES,
  EQUIPMENT_SPECS,
  getDefaultSpecs,
  generateAvailabilityData
};