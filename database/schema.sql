-- Noor Trading Corporation - Database Schema
-- SQLite (via Node's built-in node:sqlite module)

PRAGMA foreign_keys = ON;

-- Product categories
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  sku               TEXT UNIQUE,
  description       TEXT,
  price             REAL NOT NULL,
  compare_at_price  REAL,
  category_id       INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  image_url         TEXT,
  unit              TEXT NOT NULL DEFAULT 'pcs',
  stock_quantity    INTEGER NOT NULL DEFAULT 0,
  is_featured       INTEGER NOT NULL DEFAULT 0,
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number      TEXT NOT NULL UNIQUE,
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  customer_email    TEXT,
  shipping_address  TEXT NOT NULL,
  city              TEXT,
  notes             TEXT,
  subtotal          REAL NOT NULL,
  shipping_fee      REAL NOT NULL DEFAULT 0,
  total             REAL NOT NULL,
  payment_method    TEXT NOT NULL DEFAULT 'cod',
  payment_status    TEXT NOT NULL DEFAULT 'pending',
  status            TEXT NOT NULL DEFAULT 'pending',
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Order line items
CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  price       REAL NOT NULL,
  quantity    INTEGER NOT NULL,
  line_total  REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Admin users (separate from customer-facing site, which has no login)
CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
