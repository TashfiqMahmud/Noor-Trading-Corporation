const express = require('express');
const db = require('../config/database');

const router = express.Router();

function serializeProduct(row) {
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
    categorySlug: row.category_slug || null,
    imageUrl: row.image_url,
    unit: row.unit,
    stockQuantity: row.stock_quantity,
    inStock: row.stock_quantity > 0,
    isFeatured: !!row.is_featured,
  };
}

// GET /api/categories - all active categories with product counts
router.get('/categories', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.slug, c.description,
              (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
       FROM categories c
       ORDER BY c.sort_order ASC, c.name ASC`
    )
    .all();

  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      productCount: r.product_count,
    }))
  );
});

// GET /api/products - list with filters, search, sort, pagination
router.get('/products', (req, res) => {
  const { category, q, sort, featured } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const offset = (page - 1) * limit;

  const where = ['p.is_active = 1'];
  const params = {};

  if (category) {
    where.push('c.slug = :category');
    params.category = category;
  }

  if (q) {
    where.push('(p.name LIKE :q OR p.description LIKE :q OR p.sku LIKE :q)');
    params.q = `%${q}%`;
  }

  if (featured === '1' || featured === 'true') {
    where.push('p.is_featured = 1');
  }

  let orderBy = 'p.created_at DESC, p.id DESC';
  switch (sort) {
    case 'price_asc':
      orderBy = 'p.price ASC';
      break;
    case 'price_desc':
      orderBy = 'p.price DESC';
      break;
    case 'name_asc':
      orderBy = 'p.name ASC';
      break;
    case 'name_desc':
      orderBy = 'p.name DESC';
      break;
    default:
      orderBy = 'p.created_at DESC, p.id DESC';
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const baseQuery = `
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${whereSql}
  `;

  const totalRow = db.prepare(`SELECT COUNT(*) AS total ${baseQuery}`).get(params);
  const total = totalRow.total;

  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       ${baseQuery}
       ORDER BY ${orderBy}
       LIMIT :limit OFFSET :offset`
    )
    .all({ ...params, limit, offset });

  res.json({
    products: rows.map(serializeProduct),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

// GET /api/products/batch?ids=1,2,3 - fetch multiple products by id (for cart rehydration)
router.get('/products/batch', (req, res) => {
  const idsParam = req.query.ids || '';
  const ids = idsParam
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (ids.length === 0) {
    return res.json({ products: [] });
  }

  const placeholders = ids.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id IN (${placeholders})`
    )
    .all(...ids);

  res.json({ products: rows.map(serializeProduct) });
});

// GET /api/products/:slug - single product detail
router.get('/products/:slug', (req, res) => {
  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1`
    )
    .get(req.params.slug);

  if (!row) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const related = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
       ORDER BY p.created_at DESC
       LIMIT 4`
    )
    .all(row.category_id, row.id);

  res.json({
    product: serializeProduct(row),
    related: related.map(serializeProduct),
  });
});

module.exports = router;
