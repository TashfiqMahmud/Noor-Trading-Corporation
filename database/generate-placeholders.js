const fs = require('fs');
const path = require('path');

const INK = '#1C2B4A';
const ACCENT = '#D98F32';
const CANVAS = '#F4F2ED';
const DOT = '#E2DFD6';

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function frame(label, code, iconSvg) {
  const safeLabel = esc(label);
  return `<svg viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${safeLabel}">
  <defs>
    <pattern id="dots-${code}" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.4" fill="${DOT}" />
    </pattern>
  </defs>
  <rect width="600" height="450" fill="${CANVAS}" />
  <rect width="600" height="450" fill="url(#dots-${code})" />
  <g transform="translate(300,185)" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
${iconSvg}
  </g>
  <text x="300" y="372" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="${INK}" letter-spacing="3">${esc(label.toUpperCase())}</text>
  <g transform="translate(508,46) rotate(8)">
    <rect x="-42" y="-19" width="84" height="38" rx="4" fill="none" stroke="${ACCENT}" stroke-width="2.5"/>
    <text x="0" y="6" text-anchor="middle" font-family="'Courier New', monospace" font-size="17" font-weight="700" fill="${ACCENT}" letter-spacing="3">${code}</text>
  </g>
</svg>
`;
}

const icons = {
  'electronics-electrical': `
    <circle cx="-10" cy="-40" r="58" />
    <path d="M -38 -40 Q -38 -75 0 -78 Q 38 -75 38 -40 Q 38 -15 14 5 L -34 5 Q -58 -15 -38 -40 Z" transform="translate(10,0)"/>
    <line x1="-22" y1="5" x2="42" y2="5" transform="translate(10,-2)"/>
    <rect x="-16" y="6" width="52" height="14" rx="2" transform="translate(10,0)"/>
    <rect x="-12" y="20" width="44" height="10" rx="2" transform="translate(10,0)"/>
    <path d="M -10 -55 L 10 -55 L -4 -38 L 16 -38 L -14 -8" transform="translate(10,0)" stroke="${ACCENT}"/>
    <line x1="-130" y1="60" x2="-60" y2="60"/>
    <rect x="-150" y="44" width="20" height="32" rx="4"/>
    <line x1="-60" y1="44" x2="-60" y2="76"/>
    <line x1="-40" y1="50" x2="-60" y2="50"/>
    <line x1="-40" y1="70" x2="-60" y2="70"/>
  `,
  'home-kitchen-appliances': `
    <path d="M -90 60 L 90 60 L 78 -10 Q 70 -55 0 -58 Q -70 -55 -78 -10 Z"/>
    <ellipse cx="0" cy="60" rx="90" ry="14"/>
    <path d="M 78 -8 Q 130 -8 128 30 Q 126 55 90 55" />
    <ellipse cx="-2" cy="-66" rx="16" ry="8"/>
    <line x1="-2" y1="-74" x2="-2" y2="-90"/>
    <path d="M -40 -78 Q -34 -98 -44 -114"/>
    <path d="M 0 -78 Q 6 -98 -4 -114"/>
    <path d="M 40 -78 Q 46 -98 36 -114"/>
  `,
  'hardware-tools': `
    <g transform="rotate(-35)">
      <rect x="-14" y="-95" width="28" height="120" rx="6"/>
      <path d="M -26 -95 Q -26 -125 0 -125 Q 26 -125 26 -95 Q 26 -78 0 -78 Q -26 -78 -26 -95 Z"/>
      <circle cx="0" cy="-101" r="11" fill="${CANVAS}"/>
    </g>
    <g transform="rotate(35) translate(0,10)">
      <rect x="-9" y="-100" width="18" height="92" rx="4"/>
      <path d="M -9 -100 L 0 -132 L 9 -100 Z"/>
      <rect x="-20" y="-8" width="40" height="46" rx="8"/>
    </g>
  `,
  'office-stationery': `
    <rect x="-95" y="-70" width="150" height="190" rx="6" transform="translate(-10,10)"/>
    <rect x="-75" y="-50" width="150" height="190" rx="6" fill="${CANVAS}" transform="translate(0,0)"/>
    <line x1="-55" y1="-15" x2="55" y2="-15" transform="translate(0,0)"/>
    <line x1="-55" y1="15" x2="35" y2="15"/>
    <line x1="-55" y1="45" x2="45" y2="45"/>
    <line x1="-55" y1="75" x2="20" y2="75"/>
    <g transform="translate(70,-95) rotate(45)">
      <rect x="-10" y="-70" width="20" height="120" rx="3"/>
      <path d="M -10 50 L 10 50 L 0 78 Z" fill="${ACCENT}" stroke="${ACCENT}"/>
      <line x1="-10" y1="-70" x2="10" y2="-70"/>
    </g>
  `,
  'health-personal-care': `
    <rect x="-90" y="-90" width="180" height="180" rx="22"/>
    <line x1="0" y1="-45" x2="0" y2="45" stroke-width="16"/>
    <line x1="-45" y1="0" x2="45" y2="0" stroke-width="16"/>
    <path d="M -120 92 L -70 92 L -55 60 L -35 124 L -15 92 L 120 92" stroke="${ACCENT}" stroke-width="6"/>
  `,
  'industrial-safety-supplies': `
    <path d="M -110 30 Q -110 -75 0 -78 Q 110 -75 110 30 Z"/>
    <ellipse cx="0" cy="32" rx="128" ry="20"/>
    <line x1="-92" y1="-22" x2="92" y2="-22" stroke="${ACCENT}"/>
    <line x1="0" y1="-78" x2="0" y2="-92"/>
    <circle cx="-55" cy="-38" r="6" fill="${INK}"/>
    <circle cx="55" cy="-38" r="6" fill="${INK}"/>
  `,
};

const labels = {
  'electronics-electrical': { name: 'Electronics & Electrical', code: 'ELE' },
  'home-kitchen-appliances': { name: 'Home & Kitchen Appliances', code: 'HOM' },
  'hardware-tools': { name: 'Hardware & Tools', code: 'HRD' },
  'office-stationery': { name: 'Office & Stationery', code: 'OFF' },
  'health-personal-care': { name: 'Health & Personal Care', code: 'HEA' },
  'industrial-safety-supplies': { name: 'Industrial & Safety Supplies', code: 'IND' },
};

const outDir = path.join(__dirname, '..', 'public', 'images', 'products');
fs.mkdirSync(outDir, { recursive: true });

Object.entries(icons).forEach(([slug, iconSvg]) => {
  const { name, code } = labels[slug];
  const svg = frame(name, code, iconSvg);
  fs.writeFileSync(path.join(outDir, `${slug}.svg`), svg, 'utf8');
  console.log(`Wrote ${slug}.svg`);
});

// Also a generic fallback placeholder
const fallback = frame('Noor Trading Corporation', 'NTC', `
    <rect x="-90" y="-90" width="180" height="180" rx="14"/>
    <line x1="-50" y1="-30" x2="50" y2="-30"/>
    <line x1="-50" y1="0" x2="50" y2="0"/>
    <line x1="-50" y1="30" x2="20" y2="30"/>
  `);
fs.writeFileSync(path.join(outDir, 'placeholder.svg'), fallback, 'utf8');
console.log('Wrote placeholder.svg');
