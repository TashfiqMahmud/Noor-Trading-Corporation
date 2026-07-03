const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(String(username).trim());

  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  req.session.adminId = user.id;
  req.session.adminUsername = user.username;

  res.json({ success: true, username: user.username, fullName: user.full_name });
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// GET /api/admin/session - check current login state
router.get('/session', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.json({ loggedIn: true, username: req.session.adminUsername });
  }
  res.json({ loggedIn: false });
});

// POST /api/admin/change-password
router.post('/change-password', requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.session.adminId);
  if (!user || !bcrypt.compareSync(String(currentPassword), user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const hash = bcrypt.hashSync(String(newPassword), 10);
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, user.id);

  res.json({ success: true });
});

module.exports = router;
