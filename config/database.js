const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

// For Vercel (serverless), use /tmp directory; for local, use database folder
const isVercel = process.env.VERCEL === '1';
const DB_DIR = isVercel ? '/tmp' : path.join(__dirname, '..', 'database');
const DB_PATH = path.join(DB_DIR, 'noor_trading.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Apply schema on every boot - all statements use IF NOT EXISTS so this is safe.
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

module.exports = db;
