function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `NTC-${y}${m}${d}-${rand}`;
}

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const DHAKA_SHIPPING_FEE = 60;
const OUTSIDE_DHAKA_SHIPPING_FEE = 120;
const FREE_SHIPPING_THRESHOLD = 5000;

function calculateShipping(city, subtotal) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  const normalized = String(city || '').trim().toLowerCase();
  if (normalized.includes('dhaka')) return DHAKA_SHIPPING_FEE;
  return OUTSIDE_DHAKA_SHIPPING_FEE;
}

module.exports = {
  slugify,
  generateOrderNumber,
  formatMoney,
  calculateShipping,
  DHAKA_SHIPPING_FEE,
  OUTSIDE_DHAKA_SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
};
