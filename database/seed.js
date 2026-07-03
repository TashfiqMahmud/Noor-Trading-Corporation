const db = require('../config/database');
const bcrypt = require('bcryptjs');

function slugify(text) {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const categories = [
  { name: 'Hospital Beds',           description: 'Manual and electric ICU, patient, and fowler hospital beds.' },
  { name: 'Hospital Furniture',      description: 'Bedside lockers, overbed tables, wardrobes, and hospital cabinets.' },
  { name: 'Wheelchairs & Mobility',  description: 'Manual wheelchairs, electric wheelchairs, crutches, and walkers.' },
  { name: 'Surgical Equipment',      description: 'Operation theatre lights, surgical tables, and OT accessories.' },
  { name: 'Diagnostic Equipment',    description: 'Stethoscopes, BP monitors, thermometers, pulse oximeters, ECG machines.' },
  { name: 'IV Stands & Trolleys',    description: 'IV poles, medicine trolleys, dressing trolleys, and crash carts.' },
  { name: 'Stretchers & Ambulance',  description: 'Foldable stretchers, ambulance trolleys, and patient transport equipment.' },
  { name: 'Physiotherapy',           description: 'TENS units, ultrasound therapy, traction units, and rehab equipment.' },
];

const productsByCategory = {
  'Hospital Beds': [
    { name: 'Manual Fowler Hospital Bed – 2 Function', sku: 'NTC-BED-001', description: 'Two-function manual crank hospital bed with ABS headboards, side rails, and 4 castors. Epoxy-coated mild steel frame. Ideal for general wards.', price: 32000, compare_at_price: 38000, stock_quantity: 20, unit: 'pcs', is_featured: 1 },
    { name: 'ICU Electric Hospital Bed – 5 Function', sku: 'NTC-BED-002', description: 'Full electric five-function ICU bed with stainless steel IV pole, ABS side rails, battery backup and nurse-call panel. Suitable for critical care units.', price: 185000, compare_at_price: 210000, stock_quantity: 8, unit: 'pcs', is_featured: 1 },
    { name: 'Pediatric Hospital Bed with Side Rails', sku: 'NTC-BED-003', description: 'Children\'s hospital bed with full-height ABS safety rails, manual backrest, and locking castors. Bright finish suitable for pediatric wards.', price: 28500, compare_at_price: null, stock_quantity: 12, unit: 'pcs', is_featured: 0 },
    { name: 'Semi-Fowler Manual Bed – 3 Function', sku: 'NTC-BED-004', description: 'Three-crank manual hospital bed for backrest, leg rest, and height adjustment. PP half-length rails and ABS head/foot boards included.', price: 45000, compare_at_price: 52000, stock_quantity: 15, unit: 'pcs', is_featured: 0 },
    { name: 'Bunk Bed – Hospital Dormitory (Powder Coated)', sku: 'NTC-BED-005', description: 'Heavy-duty powder-coated steel bunk bed for hospital dormitories and staff rooms. Load capacity 150 kg per bunk.', price: 18000, compare_at_price: null, stock_quantity: 30, unit: 'pcs', is_featured: 0 },
  ],
  'Hospital Furniture': [
    { name: 'Bedside Locker with Drawer – ABS Top', sku: 'NTC-FUR-001', description: 'Hospital bedside cabinet with ABS top, stainless steel drawer, lower shelf, and lockable compartment. Easy-clean surface.', price: 8500, compare_at_price: 10000, stock_quantity: 35, unit: 'pcs', is_featured: 1 },
    { name: 'Overbed Table – Height Adjustable', sku: 'NTC-FUR-002', description: 'Cantilever overbed table with ABS top, telescopic stainless steel column, and castor base. Tilts for reading.', price: 6200, compare_at_price: null, stock_quantity: 40, unit: 'pcs', is_featured: 0 },
    { name: 'Hospital Medicine Cabinet – 4 Door', sku: 'NTC-FUR-003', description: 'Four-door stainless steel medicine storage cabinet with glass shelves and individual locks. Wall-mounted or free-standing.', price: 38000, compare_at_price: 45000, stock_quantity: 10, unit: 'pcs', is_featured: 1 },
    { name: 'Patient Chair – Recliner with Footrest', sku: 'NTC-FUR-004', description: 'Three-position vinyl recliner chair for patient waiting areas and IV infusion. Wipe-clean surface, powder-coated frame.', price: 12500, compare_at_price: null, stock_quantity: 25, unit: 'pcs', is_featured: 0 },
    { name: 'Hospital Wardrobe – 2 Door Steel', sku: 'NTC-FUR-005', description: 'Two-door mild steel wardrobe with hanging rail, shelf, and mirror. Epoxy finish. Used in private wards and clinics.', price: 15000, compare_at_price: 18000, stock_quantity: 18, unit: 'pcs', is_featured: 0 },
  ],
  'Wheelchairs & Mobility': [
    { name: 'Manual Wheelchair – Foldable Steel', sku: 'NTC-WHL-001', description: 'Standard foldable wheelchair with 24" rear wheels, footrests, armrests, and anti-tip bars. Lightweight powder-coated frame. Max load 120 kg.', price: 9500, compare_at_price: 11000, stock_quantity: 30, unit: 'pcs', is_featured: 1 },
    { name: 'Electric Power Wheelchair – Dual Motor', sku: 'NTC-WHL-002', description: 'Dual-motor electric wheelchair with joystick control, 12Ah lithium battery, 20 km range, and foldable frame. For elderly and differently-abled users.', price: 68000, compare_at_price: 75000, stock_quantity: 6, unit: 'pcs', is_featured: 1 },
    { name: 'Aluminum Walking Frame / Zimmer Frame', sku: 'NTC-WHL-003', description: 'Lightweight aluminum Zimmer walking frame with non-slip rubber tips. Folds flat for storage. Adjustable height 78–90 cm.', price: 2800, compare_at_price: null, stock_quantity: 60, unit: 'pcs', is_featured: 0 },
    { name: 'Axillary Crutches – Adjustable (Pair)', sku: 'NTC-WHL-004', description: 'Aluminum adjustable axillary crutches with foam armpit pads and ergonomic hand grips. Height 135–165 cm. Sold per pair.', price: 1800, compare_at_price: null, stock_quantity: 80, unit: 'pair', is_featured: 0 },
    { name: 'Commode Wheelchair – 3-in-1', sku: 'NTC-WHL-005', description: 'Three-in-one commode chair, transport wheelchair, and shower chair. Removable bucket, padded seat, and folding footrests.', price: 14500, compare_at_price: 17000, stock_quantity: 15, unit: 'pcs', is_featured: 0 },
  ],
  'Surgical Equipment': [
    { name: 'Balaji Veego 5+5 Twin LED Surgical Operation Light', sku: 'NTC-SRG-001', description: 'Twin 5+5 LED shadowless surgical theatre light with 160,000 lux intensity, colour temperature 4300K–4500K, and ceiling mounting. Memory arm for positioning.', price: 240000, compare_at_price: 280000, stock_quantity: 4, unit: 'pcs', is_featured: 1 },
    { name: 'Manual Operating Table – Hydraulic', sku: 'NTC-SRG-002', description: 'Hydraulic manual operating table with Trendelenburg, lateral tilt, and back section adjustment. Stainless steel top with foam padding.', price: 155000, compare_at_price: null, stock_quantity: 5, unit: 'pcs', is_featured: 1 },
    { name: 'Gynecology Examination Table', sku: 'NTC-SRG-003', description: 'Three-section gynecology table with adjustable backrest, stirrups, and pull-out leg rest. Leatherette upholstery, powder-coated frame.', price: 42000, compare_at_price: 48000, stock_quantity: 8, unit: 'pcs', is_featured: 0 },
    { name: 'Instrument Trolley – Stainless Steel 2 Shelf', sku: 'NTC-SRG-004', description: 'Two-shelf stainless steel instrument trolley with swivel castors and push handle. For OT instrument handling.', price: 9800, compare_at_price: null, stock_quantity: 20, unit: 'pcs', is_featured: 0 },
    { name: 'Film Viewer Lamp – Single View LED', sku: 'NTC-SRG-005', description: 'Single-panel LED X-ray film viewer with uniform backlit illumination and on/off switch. For radiology and diagnostic rooms.', price: 6000, compare_at_price: 8000, stock_quantity: 18, unit: 'pcs', is_featured: 0 },
  ],
  'Diagnostic Equipment': [
    { name: 'Digital Blood Pressure Monitor – Arm Type', sku: 'NTC-DGN-001', description: 'Automatic upper-arm digital BP monitor with large LCD, irregular heartbeat detection, 60-memory recall, and AC adapter. WHO classification indicator.', price: 2400, compare_at_price: 2800, stock_quantity: 50, unit: 'pcs', is_featured: 1 },
    { name: 'Infrared Forehead Thermometer', sku: 'NTC-DGN-002', description: 'Non-contact infrared thermometer with fever alarm, 32-reading memory, and 1-second measurement. Suitable for all ages.', price: 1100, compare_at_price: null, stock_quantity: 80, unit: 'pcs', is_featured: 0 },
    { name: 'Pulse Oximeter – Fingertip', sku: 'NTC-DGN-003', description: 'Compact fingertip pulse oximeter displaying SpO2, pulse rate, and waveform. Auto power-off. Suitable for home and clinical use.', price: 850, compare_at_price: 1000, stock_quantity: 100, unit: 'pcs', is_featured: 0 },
    { name: 'Littmann Classic III Stethoscope', sku: 'NTC-DGN-004', description: 'Littmann Classic III stethoscope with dual-sided chest piece tunable to low and high frequencies. Available in multiple colours.', price: 8500, compare_at_price: null, stock_quantity: 25, unit: 'pcs', is_featured: 1 },
    { name: '12-Lead ECG Machine – Portable', sku: 'NTC-DGN-005', description: 'Portable 12-lead electrocardiograph with thermal printer, 7-inch display, built-in interpretation, and rechargeable battery.', price: 98000, compare_at_price: 115000, stock_quantity: 6, unit: 'pcs', is_featured: 1 },
  ],
  'IV Stands & Trolleys': [
    { name: 'IV Drip Stand – 5 Wheel Stainless Steel', sku: 'NTC-IVS-001', description: 'Stainless steel IV drip stand with five-wheel base, height adjustment 90–180 cm, and four-hook top. Corrosion-resistant.', price: 3200, compare_at_price: null, stock_quantity: 60, unit: 'pcs', is_featured: 0 },
    { name: 'Medicine Trolley – ABS 3 Shelf Lockable', sku: 'NTC-IVS-002', description: 'Three-shelf ABS medicine distribution trolley with individual drawer locks, central brake, and handle. Available in blue and grey.', price: 28000, compare_at_price: 32000, stock_quantity: 12, unit: 'pcs', is_featured: 1 },
    { name: 'Crash Cart / Emergency Trolley', sku: 'NTC-IVS-003', description: 'Five-drawer steel crash cart with defibrillator shelf, monitor mount, IV pole, oxygen tank holder, and central lock.', price: 55000, compare_at_price: 62000, stock_quantity: 5, unit: 'pcs', is_featured: 1 },
    { name: 'Dressing Trolley – Stainless Steel 2 Shelf', sku: 'NTC-IVS-004', description: 'Two-shelf stainless steel dressing trolley with push handle, swivel castors, and removable tray. For dressing and wound care.', price: 8500, compare_at_price: null, stock_quantity: 22, unit: 'pcs', is_featured: 0 },
    { name: 'Instrument Sterilization Tray Set', sku: 'NTC-IVS-005', description: 'Set of 3 stainless steel sterilization trays with perforated baskets and lids for autoclave use.', price: 3500, compare_at_price: null, stock_quantity: 45, unit: 'set', is_featured: 0 },
  ],
  'Stretchers & Ambulance': [
    { name: 'Foldable Stretcher – Canvas Lightweight', sku: 'NTC-STR-001', description: 'Lightweight foldable canvas stretcher with aluminum poles. Easy one-fold storage. Load capacity 150 kg. Used in ambulances and emergency.', price: 4500, compare_at_price: 5500, stock_quantity: 30, unit: 'pcs', is_featured: 0 },
    { name: 'Ambulance Trolley – Electric Powered', sku: 'NTC-STR-002', description: 'Electric-powered ambulance loading trolley with automatic drop-legs, back section lift, and 250 kg capacity. Compatible with most ambulances.', price: 185000, compare_at_price: null, stock_quantity: 3, unit: 'pcs', is_featured: 1 },
    { name: 'Scoop Stretcher – Aluminum Split Frame', sku: 'NTC-STR-003', description: 'Aluminum split-frame scoop stretcher with adjustable length, head support, and body straps. Essential for spinal injury rescue.', price: 12000, compare_at_price: 14000, stock_quantity: 15, unit: 'pcs', is_featured: 0 },
    { name: 'Stair Chair – Foldable Emergency', sku: 'NTC-STR-004', description: 'Foldable stair chair for patient evacuation. Non-slip track system, safety belt, and handles for two operators. Compact storage.', price: 18000, compare_at_price: null, stock_quantity: 8, unit: 'pcs', is_featured: 0 },
    { name: 'Transfer Board – Slide Sheet Set', sku: 'NTC-STR-005', description: 'Set of two patient transfer slide sheets for friction-free repositioning in bed or onto stretcher. Washable nylon fabric.', price: 2200, compare_at_price: null, stock_quantity: 50, unit: 'set', is_featured: 0 },
  ],
  'Physiotherapy': [
    { name: 'TENS Unit – 4-Channel Digital', sku: 'NTC-PHY-001', description: 'Four-channel digital TENS/EMS unit with 25 preset programmes, timer, and intensity control. Rechargeable battery with accessories.', price: 18500, compare_at_price: 22000, stock_quantity: 15, unit: 'pcs', is_featured: 1 },
    { name: 'Therapeutic Ultrasound Machine 1MHz/3MHz', sku: 'NTC-PHY-002', description: 'Dual-frequency 1 MHz/3 MHz ultrasound therapy unit for deep tissue treatment. Continuous and pulse modes, 5 cm² sound head.', price: 35000, compare_at_price: 40000, stock_quantity: 8, unit: 'pcs', is_featured: 1 },
    { name: 'Hot & Cold Therapy Pack Set', sku: 'NTC-PHY-003', description: 'Reusable gel pack set for hot and cold therapy. Microwave-safe, freezer-safe. Includes four sizes and protective covers.', price: 1200, compare_at_price: null, stock_quantity: 80, unit: 'set', is_featured: 0 },
    { name: 'Cervical Traction Unit – Over-Door', sku: 'NTC-PHY-004', description: 'Over-door cervical traction kit with adjustable head halter, pulley, rope, and water weight bag (up to 8 kg).', price: 2800, compare_at_price: null, stock_quantity: 35, unit: 'set', is_featured: 0 },
    { name: 'Exercise Pedal Machine – Seated Bike', sku: 'NTC-PHY-005', description: 'Mini seated exercise pedal machine with resistance adjustment and LCD display showing speed, distance, and calories. For upper and lower limb rehab.', price: 4500, compare_at_price: 5200, stock_quantity: 20, unit: 'pcs', is_featured: 0 },
  ],
};

function run() {
  const categoryCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
  const categorySlugMap = {};

  if (categoryCount === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)');
    categories.forEach((cat, index) => {
      const slug = slugify(cat.name);
      insertCategory.run(cat.name, slug, cat.description, index);
    });
    console.log('Seeded ' + categories.length + ' categories.');
  }

  const allCategories = db.prepare('SELECT id, name, slug FROM categories').all();
  allCategories.forEach(c => { categorySlugMap[c.name] = c; });

  const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (productCount === 0) {
    const insertProduct = db.prepare(
      'INSERT INTO products (name, slug, sku, description, price, compare_at_price, category_id, image_url, unit, stock_quantity, is_featured, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)'
    );
    let totalInserted = 0;
    Object.entries(productsByCategory).forEach(([categoryName, products]) => {
      const cat = categorySlugMap[categoryName];
      if (!cat) return;
      const imagePath = '/images/products/' + cat.slug + '.svg';
      products.forEach(p => {
        const slug = slugify(p.name);
        insertProduct.run(p.name, slug, p.sku, p.description, p.price, p.compare_at_price || null, cat.id, imagePath, p.unit, p.stock_quantity, p.is_featured);
        totalInserted++;
      });
    });
    console.log('Seeded ' + totalInserted + ' products.');
  }

  const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admin_users').get().c;
  if (adminCount === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'NoorAdmin@2026';
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO admin_users (username, password_hash, full_name) VALUES (?, ?, ?)').run(username, hash, 'Noor Trading Admin');
    console.log('Admin created: username=' + username + ' password=' + password);
  }
}

run();
