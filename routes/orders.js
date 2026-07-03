const express = require('express');
const db = require('../config/database');
const { generateOrderNumber, calculateShipping } = require('../config/helpers');

const router = express.Router();

const PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serializeOrder(orderRow, items) {
  return {
    orderNumber: orderRow.order_number,
    customerName: orderRow.customer_name,
    customerPhone: orderRow.customer_phone,
    customerEmail: orderRow.customer_email,
    shippingAddress: orderRow.shipping_address,
    city: orderRow.city,
    notes: orderRow.notes,
    subtotal: orderRow.subtotal,
    shippingFee: orderRow.shipping_fee,
    total: orderRow.total,
    paymentMethod: orderRow.payment_method,
    paymentStatus: orderRow.payment_status,
    status: orderRow.status,
    createdAt: orderRow.created_at,
    items: items.map((it) => ({
      productId: it.product_id,
      name: it.product_name,
      sku: it.product_sku,
      price: it.price,
      quantity: it.quantity,
      lineTotal: it.line_total,
    })),
  };
}

// POST /api/orders - place a new order
router.post('/orders', (req, res) => {
  const body = req.body || {};
  const customer = body.customer || {};
  const items = Array.isArray(body.items) ? body.items : [];

  // ---- Validation ----
  const errors = {};

  const name = String(customer.name || '').trim();
  const phone = String(customer.phone || '').trim();
  const address = String(customer.address || '').trim();
  const email = String(customer.email || '').trim();
  const city = String(customer.city || '').trim();
  const notes = String(customer.notes || '').trim();

  if (!name || name.length < 2) {
    errors.name = 'Full name is required.';
  }
  if (!phone || !PHONE_REGEX.test(phone)) {
    errors.phone = 'A valid phone number is required.';
  }
  if (!address || address.length < 5) {
    errors.address = 'Full delivery address is required.';
  }
  if (email && !EMAIL_REGEX.test(email)) {
    errors.email = 'Email address looks invalid.';
  }
  if (items.length === 0) {
    errors.items = 'Your cart is empty.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Please correct the highlighted fields.', fields: errors });
  }

  // ---- Validate items & compute totals using current DB prices ----
  const placeholders = items.map(() => '?').join(',');
  const productIds = items
    .map((it) => parseInt(it.productId, 10))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (productIds.length !== items.length) {
    return res.status(400).json({ error: 'Invalid items in cart.' });
  }

  const products = db
    .prepare(
      `SELECT id, name, sku, price, stock_quantity, is_active FROM products WHERE id IN (${placeholders})`
    )
    .all(...productIds);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const lineItems = [];
  const stockErrors = [];

  for (const it of items) {
    const productId = parseInt(it.productId, 10);
    const quantity = parseInt(it.quantity, 10);
    const product = productMap.get(productId);

    if (!product || !product.is_active) {
      stockErrors.push(`One of the items in your cart is no longer available.`);
      continue;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      stockErrors.push(`Invalid quantity for ${product.name}.`);
      continue;
    }
    if (quantity > product.stock_quantity) {
      stockErrors.push(
        `Only ${product.stock_quantity} unit(s) of "${product.name}" left in stock.`
      );
      continue;
    }

    lineItems.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity,
      lineTotal: Math.round(product.price * quantity * 100) / 100,
    });
  }

  if (stockErrors.length > 0) {
    return res.status(409).json({ error: 'Some items in your cart need attention.', details: stockErrors });
  }

  const subtotal = Math.round(lineItems.reduce((sum, li) => sum + li.lineTotal, 0) * 100) / 100;
  const shippingFee = calculateShipping(city, subtotal);
  const total = Math.round((subtotal + shippingFee) * 100) / 100;

  // ---- Persist order in a transaction ----
  let orderNumber = generateOrderNumber();
  let attempts = 0;
  while (db.prepare('SELECT 1 FROM orders WHERE order_number = ?').get(orderNumber) && attempts < 5) {
    orderNumber = generateOrderNumber();
    attempts += 1;
  }

  try {
    db.exec('BEGIN');

    const insertOrder = db.prepare(`
      INSERT INTO orders
        (order_number, customer_name, customer_phone, customer_email, shipping_address, city, notes,
         subtotal, shipping_fee, total, payment_method, payment_status, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cod', 'pending', 'pending')
    `);

    const result = insertOrder.run(
      orderNumber,
      name,
      phone,
      email || null,
      address,
      city || null,
      notes || null,
      subtotal,
      shippingFee,
      total
    );

    const orderId = Number(result.lastInsertRowid);

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_sku, price, quantity, line_total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const decrementStock = db.prepare(
      `UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = datetime('now') WHERE id = ?`
    );

    for (const li of lineItems) {
      insertItem.run(orderId, li.productId, li.name, li.sku, li.price, li.quantity, li.lineTotal);
      decrementStock.run(li.quantity, li.productId);
    }

    db.exec('COMMIT');

    return res.status(201).json({
      orderNumber,
      subtotal,
      shippingFee,
      total,
      itemCount: lineItems.reduce((sum, li) => sum + li.quantity, 0),
    });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Order creation failed:', err);
    return res.status(500).json({ error: 'Something went wrong while placing your order. Please try again.' });
  }
});

// GET /api/orders/:orderNumber - order confirmation lookup
router.get('/orders/:orderNumber', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(req.params.orderNumber);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json(serializeOrder(order, items));
});

module.exports = router;
