const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');
const { upload, UPLOAD_DIR } = require('../middleware/upload');
const { slugify } = require('../config/helpers');

const router = express.Router();

router.use(requireAdmin);

function uniqueSlug(name, excludeId) {
  const base = slugify(name) || 'item';
  let slug = base;
  let counter = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

function serializeProductAdmin(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    description: row.description,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    categoryId: row.category_id,
    categoryName: row.category_name || null,
    imageUrl: row.image_url,
    unit: row.unit,
    stockQuantity: row.stock_quantity,
    isFeatured: !!row.is_featured,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseBool(value) {
  return value === true || value === 'true' || value === '1' || value === 1 || value === 'on';
}

function parseNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// PRODUCTS
// ---------------------------------------------------------------------------

// GET /api/admin/products
router.get('/products', (req, res) => {
  const { q, category, status } = req.query;
  const where = [];
  const params = {};

  if (q) {
    where.push('(p.name LIKE :q OR p.sku LIKE :q)');
    params.q = `%${q}%`;
  }
  if (category) {
    where.push('p.category_id = :category');
    params.category = category;
  }
  if (status === 'active') where.push('p.is_active = 1');
  if (status === 'inactive') where.push('p.is_active = 0');
  if (status === 'low-stock') where.push('p.stock_quantity <= 5 AND p.stock_quantity > 0');
  if (status === 'out-of-stock') where.push('p.stock_quantity = 0');

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY p.created_at DESC, p.id DESC`
    )
    .all(params);

  res.json({ products: rows.map(serializeProductAdmin) });
});

// GET /api/admin/products/:id
router.get('/products/:id', (req, res) => {
  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`
    )
    .get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Product not found.' });
  res.json(serializeProductAdmin(row));
});

// POST /api/admin/products
router.post('/products', upload.single('image'), (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const price = parseNullableNumber(body.price);

  if (!name) return res.status(400).json({ error: 'Product name is required.' });
  if (price === null || price < 0) return res.status(400).json({ error: 'A valid price is required.' });

  const sku = body.sku ? String(body.sku).trim() : null;
  if (sku) {
    const existingSku = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
    if (existingSku) return res.status(409).json({ error: `SKU "${sku}" is already in use.` });
  }

  const slug = uniqueSlug(name);
  const categoryId = body.categoryId ? parseInt(body.categoryId, 10) : null;
  const compareAtPrice = parseNullableNumber(body.compareAtPrice);
  const stockQuantity = parseInt(body.stockQuantity, 10);
  const unit = body.unit ? String(body.unit).trim() : 'pcs';
  const isFeatured = parseBool(body.isFeatured) ? 1 : 0;
  const isActive = body.isActive === undefined ? 1 : parseBool(body.isActive) ? 1 : 0;
  const description = body.description ? String(body.description).trim() : null;

  let imageUrl = '/images/products/placeholder.svg';
  if (req.file) {
    imageUrl = `/uploads/products/${req.file.filename}`;
  } else if (body.imageUrl) {
    imageUrl = String(body.imageUrl).trim();
  }

  const result = db
    .prepare(
      `INSERT INTO products
        (name, slug, sku, description, price, compare_at_price, category_id, image_url, unit, stock_quantity, is_featured, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      name,
      slug,
      sku,
      description,
      price,
      compareAtPrice,
      categoryId,
      imageUrl,
      unit,
      Number.isInteger(stockQuantity) ? stockQuantity : 0,
      isFeatured,
      isActive
    );

  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    )
    .get(Number(result.lastInsertRowid));

  res.status(201).json(serializeProductAdmin(row));
});

// PUT /api/admin/products/:id
router.put('/products/:id', upload.single('image'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found.' });

  const body = req.body || {};
  const name = body.name !== undefined ? String(body.name).trim() : existing.name;
  if (!name) return res.status(400).json({ error: 'Product name is required.' });

  const price = body.price !== undefined ? parseNullableNumber(body.price) : existing.price;
  if (price === null || price < 0) return res.status(400).json({ error: 'A valid price is required.' });

  const sku = body.sku !== undefined ? (String(body.sku).trim() || null) : existing.sku;
  if (sku && sku !== existing.sku) {
    const existingSku = db.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(sku, id);
    if (existingSku) return res.status(409).json({ error: `SKU "${sku}" is already in use.` });
  }

  const slug = name !== existing.name ? uniqueSlug(name, id) : existing.slug;
  const categoryId =
    body.categoryId !== undefined ? (body.categoryId ? parseInt(body.categoryId, 10) : null) : existing.category_id;
  const compareAtPrice =
    body.compareAtPrice !== undefined ? parseNullableNumber(body.compareAtPrice) : existing.compare_at_price;
  const stockQuantity =
    body.stockQuantity !== undefined ? parseInt(body.stockQuantity, 10) : existing.stock_quantity;
  const unit = body.unit !== undefined ? String(body.unit).trim() || 'pcs' : existing.unit;
  const isFeatured = body.isFeatured !== undefined ? (parseBool(body.isFeatured) ? 1 : 0) : existing.is_featured;
  const isActive = body.isActive !== undefined ? (parseBool(body.isActive) ? 1 : 0) : existing.is_active;
  const description = body.description !== undefined ? String(body.description).trim() || null : existing.description;

  let imageUrl = existing.image_url;
  if (req.file) {
    imageUrl = `/uploads/products/${req.file.filename}`;
    // best-effort cleanup of old uploaded image
    if (existing.image_url && existing.image_url.startsWith('/uploads/products/')) {
      const oldPath = path.join(UPLOAD_DIR, path.basename(existing.image_url));
      fs.unlink(oldPath, () => {});
    }
  } else if (body.imageUrl !== undefined && String(body.imageUrl).trim()) {
    imageUrl = String(body.imageUrl).trim();
  }

  db.prepare(
    `UPDATE products SET
       name = ?, slug = ?, sku = ?, description = ?, price = ?, compare_at_price = ?,
       category_id = ?, image_url = ?, unit = ?, stock_quantity = ?, is_featured = ?, is_active = ?,
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    name,
    slug,
    sku,
    description,
    price,
    compareAtPrice,
    categoryId,
    imageUrl,
    unit,
    Number.isInteger(stockQuantity) ? stockQuantity : existing.stock_quantity,
    isFeatured,
    isActive,
    id
  );

  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    )
    .get(id);

  res.json(serializeProductAdmin(row));
});

// PATCH /api/admin/products/:id/toggle - toggle active state
router.patch('/products/:id/toggle', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found.' });

  const newState = existing.is_active ? 0 : 1;
  db.prepare(`UPDATE products SET is_active = ?, updated_at = datetime('now') WHERE id = ?`).run(newState, id);
  res.json({ id, isActive: !!newState });
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found.' });

  const usedInOrders = db.prepare('SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1').get(id);
  if (usedInOrders) {
    // Preserve order history integrity - deactivate instead of hard delete
    db.prepare(`UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?`).run(id);
    return res.json({ success: true, deactivated: true, message: 'Product has existing orders, so it was deactivated instead of deleted.' });
  }

  if (existing.image_url && existing.image_url.startsWith('/uploads/products/')) {
    const imgPath = path.join(UPLOAD_DIR, path.basename(existing.image_url));
    fs.unlink(imgPath, () => {});
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ success: true, deleted: true });
});

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------

// GET /api/admin/categories
router.get('/categories', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
       FROM categories c ORDER BY c.sort_order ASC, c.name ASC`
    )
    .all();

  res.json({
    categories: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      sortOrder: r.sort_order,
      productCount: r.product_count,
    })),
  });
});

// POST /api/admin/categories
router.post('/categories', (req, res) => {
  const { name, description, sortOrder } = req.body || {};
  const trimmedName = String(name || '').trim();
  if (!trimmedName) return res.status(400).json({ error: 'Category name is required.' });

  const slug = slugify(trimmedName);
  const existing = db.prepare('SELECT id FROM categories WHERE slug = ? OR name = ?').get(slug, trimmedName);
  if (existing) return res.status(409).json({ error: 'A category with this name already exists.' });

  const result = db
    .prepare('INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)')
    .run(trimmedName, slug, description ? String(description).trim() : null, parseInt(sortOrder, 10) || 0);

  res.status(201).json({ id: Number(result.lastInsertRowid), name: trimmedName, slug });
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Category not found.' });

  const { name, description, sortOrder } = req.body || {};
  const trimmedName = name !== undefined ? String(name).trim() : existing.name;
  if (!trimmedName) return res.status(400).json({ error: 'Category name is required.' });

  const slug = trimmedName !== existing.name ? slugify(trimmedName) : existing.slug;
  if (slug !== existing.slug) {
    const slugTaken = db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(slug, id);
    if (slugTaken) return res.status(409).json({ error: 'A category with this name already exists.' });
  }

  db.prepare('UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ? WHERE id = ?').run(
    trimmedName,
    slug,
    description !== undefined ? String(description).trim() || null : existing.description,
    sortOrder !== undefined ? parseInt(sortOrder, 10) || 0 : existing.sort_order,
    id
  );

  res.json({ success: true });
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Category not found.' });

  // Unassign products instead of cascading deletes
  db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);

  res.json({ success: true });
});

module.exports = router;
