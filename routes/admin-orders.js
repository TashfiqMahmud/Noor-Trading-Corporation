const express = require('express');
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAdmin);

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

function serializeOrder(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    shippingAddress: row.shipping_address,
    city: row.city,
    notes: row.notes,
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    total: row.total,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// ORDERS
// ---------------------------------------------------------------------------

// GET /api/admin/orders
router.get('/orders', (req, res) => {
  const { status, q } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const where = [];
  const params = {};

  if (status && VALID_STATUSES.includes(status)) {
    where.push('status = :status');
    params.status = status;
  }
  if (q) {
    where.push('(order_number LIKE :q OR customer_name LIKE :q OR customer_phone LIKE :q)');
    params.q = `%${q}%`;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) AS c FROM orders ${whereSql}`).get(params).c;

  const rows = db
    .prepare(`SELECT * FROM orders ${whereSql} ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset`)
    .all({ ...params, limit, offset });

  res.json({
    orders: rows.map(serializeOrder),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

// GET /api/admin/orders/:id
router.get('/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

  res.json({
    ...serializeOrder(order),
    items: items.map((it) => ({
      productId: it.product_id,
      name: it.product_name,
      sku: it.product_sku,
      price: it.price,
      quantity: it.quantity,
      lineTotal: it.line_total,
    })),
  });
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Order not found.' });

  const { status, paymentStatus } = req.body || {};

  const newStatus = status !== undefined ? status : existing.status;
  const newPaymentStatus = paymentStatus !== undefined ? paymentStatus : existing.payment_status;

  if (!VALID_STATUSES.includes(newStatus)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  if (!VALID_PAYMENT_STATUSES.includes(newPaymentStatus)) {
    return res.status(400).json({ error: `Payment status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}` });
  }

  try {
    db.exec('BEGIN');

    // Handle stock restoration / re-reservation when toggling cancellation
    if (newStatus === 'cancelled' && existing.status !== 'cancelled') {
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(id);
      const restock = db.prepare(`UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = datetime('now') WHERE id = ?`);
      items.forEach((it) => {
        if (it.product_id) restock.run(it.quantity, it.product_id);
      });
    } else if (newStatus !== 'cancelled' && existing.status === 'cancelled') {
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(id);
      const deplete = db.prepare(`UPDATE products SET stock_quantity = MAX(stock_quantity - ?, 0), updated_at = datetime('now') WHERE id = ?`);
      items.forEach((it) => {
        if (it.product_id) deplete.run(it.quantity, it.product_id);
      });
    }

    db.prepare(`UPDATE orders SET status = ?, payment_status = ?, updated_at = datetime('now') WHERE id = ?`).run(
      newStatus,
      newPaymentStatus,
      id
    );

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Failed to update order status:', err);
    return res.status(500).json({ error: 'Failed to update order.' });
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json(serializeOrder(updated));
});

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------

// GET /api/admin/dashboard
router.get('/dashboard', (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  const pendingOrders = db.prepare(`SELECT COUNT(*) AS c FROM orders WHERE status = 'pending'`).get().c;
  const processingOrders = db.prepare(`SELECT COUNT(*) AS c FROM orders WHERE status = 'processing'`).get().c;

  const revenueRow = db
    .prepare(`SELECT COALESCE(SUM(total), 0) AS revenue FROM orders WHERE status != 'cancelled'`)
    .get();

  const todayRow = db
    .prepare(
      `SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
       FROM orders
       WHERE status != 'cancelled' AND date(created_at) = date('now')`
    )
    .get();

  const totalProducts = db.prepare('SELECT COUNT(*) AS c FROM products WHERE is_active = 1').get().c;
  const lowStockProducts = db
    .prepare(`SELECT COUNT(*) AS c FROM products WHERE is_active = 1 AND stock_quantity > 0 AND stock_quantity <= 5`)
    .get().c;
  const outOfStockProducts = db
    .prepare(`SELECT COUNT(*) AS c FROM products WHERE is_active = 1 AND stock_quantity = 0`)
    .get().c;

  const recentOrders = db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 5')
    .all()
    .map(serializeOrder);

  const lowStockList = db
    .prepare(
      `SELECT id, name, sku, stock_quantity FROM products
       WHERE is_active = 1 AND stock_quantity <= 5
       ORDER BY stock_quantity ASC LIMIT 6`
    )
    .all();

  res.json({
    totalOrders,
    pendingOrders,
    processingOrders,
    totalRevenue: revenueRow.revenue,
    todayOrders: todayRow.orders,
    todayRevenue: todayRow.revenue,
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    recentOrders,
    lowStockList: lowStockList.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stock_quantity,
    })),
  });
});

module.exports = router;
