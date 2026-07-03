require('dotenv').config();

const path = require('node:path');
const express = require('express');
const session = require('express-session');
const multer = require('multer');

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const adminAuthRouter = require('./routes/admin-auth');
const adminCatalogRouter = require('./routes/admin-catalog');
const adminOrdersRouter = require('./routes/admin-orders');

// Ensure the database is created/migrated on boot.
require('./config/database');
require('./database/seed');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (IS_PRODUCTION) {
  // Needed for secure cookies when running behind a proxy (Render, Railway, etc.)
  app.set('trust proxy', 1);
}

if (!process.env.SESSION_SECRET) {
  console.warn(
    'WARNING: SESSION_SECRET is not set in your environment. Using an insecure default. ' +
      'Set SESSION_SECRET in your .env file before deploying to production.'
  );
}

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'ntc.sid',
    secret: process.env.SESSION_SECRET || 'noor-trading-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PRODUCTION,
      maxAge: 1000 * 60 * 60 * 12, // 12 hours
    },
  })
);

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api', productsRouter);
app.use('/api', ordersRouter);
app.use('/api/admin', adminAuthRouter);
app.use('/api/admin', adminCatalogRouter);
app.use('/api/admin', adminOrdersRouter);

// ---------------------------------------------------------------------------
// Static frontend
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

// Multer (file upload) errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Image is too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err && err.message && err.message.includes('Only JPG')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Noor Trading Corporation server running at http://localhost:${PORT}`);
});
