const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const logger = require('./logger');

let pool;
let schemaEnsured = false;

function getConfig() {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const port = Number(process.env.MYSQL_PORT || 3306);
  const connectTimeout = Number(process.env.MYSQL_CONNECT_TIMEOUT_MS || 10000);

  if (!host || !user || !database) {
    throw new Error('MYSQL_HOST, MYSQL_USER and MYSQL_DATABASE must be set');
  }

  return {
    host,
    user,
    password,
    database,
    port,
    connectTimeout,
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_SIZE || 10),
    queueLimit: 0,
    charset: 'utf8mb4',
    namedPlaceholders: true,
  };
}

function assertSafeDatabaseName(name) {
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error('MYSQL_DATABASE contains invalid characters');
  }
}

async function ensureDatabaseExists(cfg) {
  assertSafeDatabaseName(cfg.database);
  const bootstrap = await mysql.createConnection({
    host: cfg.host,
    user: cfg.user,
    password: cfg.password,
    port: cfg.port,
    connectTimeout: cfg.connectTimeout,
    charset: 'utf8mb4',
  });

  try {
    await bootstrap.query(
      `CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await bootstrap.end();
  }
}

function dbTargetLabel() {
  return `${process.env.MYSQL_HOST || 'unset-host'}:${process.env.MYSQL_PORT || 3306}/${process.env.MYSQL_DATABASE || 'unset-db'}`;
}

async function connect() {
  if (pool) return pool;
  const cfg = getConfig();
  await ensureDatabaseExists(cfg);
  pool = mysql.createPool(cfg);
  await pool.query('SELECT 1');
  logger.info('MySQL connected');
  return pool;
}

async function query(sql, params = []) {
  const activePool = await connect();
  const sanitizeBindValues = (value) => {
    if (value === undefined) return null;
    if (Array.isArray(value)) return value.map(sanitizeBindValues);
    if (
      value &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      !Buffer.isBuffer(value)
    ) {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = sanitizeBindValues(v);
      }
      return out;
    }
    return value;
  };

  const safeParams = sanitizeBindValues(params);
  const [rows] = await activePool.execute(sql, safeParams);
  return rows;
}

async function ensureSchema() {
  if (schemaEnsured) return;
  const activePool = await connect();
  const schemaPath = path.join(__dirname, '..', 'sql', '01_schema.sql');

  if (!fs.existsSync(schemaPath)) {
    logger.warn(`Schema file not found at ${schemaPath}`);
    return;
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  const statements = sql
    .split(/;\s*[\r\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await activePool.query(statement);
  }

  schemaEnsured = true;
  logger.info('MySQL schema ensured');
}

async function disconnect() {
  if (!pool) return;
  try {
    await pool.end();
    logger.info('MySQL disconnected');
  } catch (err) {
    logger.warn('Error while disconnecting MySQL:', err && err.message ? err.message : err);
  } finally {
    pool = null;
    schemaEnsured = false;
  }
}

async function connectWithRetry(opts = {}) {
  const maxAttempts = Number(opts.attempts ?? process.env.DB_CONN_RETRY_ATTEMPTS ?? 5);
  const baseDelay = Number(opts.delayMs ?? process.env.DB_CONN_RETRY_DELAY_MS ?? 2000);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const activePool = await connect();
      await ensureSchema();
      return activePool;
    } catch (err) {
      const isLast = attempt === maxAttempts;
      if (typeof opts.onAttempt === 'function') {
        try {
          opts.onAttempt(err, attempt, maxAttempts);
        } catch (_) {}
      }

      const message = err && err.message ? err.message : String(err);
      logger.error(`DB connect attempt ${attempt}/${maxAttempts} failed for ${dbTargetLabel()}: ${message}`);
      if (isLast) {
        logger.error(`Failed to connect to MySQL after retries. Target: ${dbTargetLabel()}`);
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.info(`Retrying DB connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unexpected DB retry state');
}

module.exports = {
  connect,
  connectWithRetry,
  disconnect,
  ensureSchema,
  query,
};

