const { query } = require('../../config/database');
const { generateId, parseDate, parseJson, toBool, toJson, withId } = require('../../utils/mysql-utils');

function mapWebhook(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    source: row.source,
    event: row.event,
    payload: parseJson(row.payload, {}),
    headers: parseJson(row.headers, {}),
    processed: toBool(row.processed, false),
    processedAt: parseDate(row.processedAt),
    error: row.error || null,
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

async function createWebhook(payload, headers) {
  const _id = generateId();
  const now = new Date();
  await query(
    `INSERT INTO webhooks (_id, source, event, payload, headers, processed, processedAt, error, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      payload.source,
      payload.event,
      toJson(payload.payload || {}),
      toJson(headers || {}),
      0,
      null,
      null,
      now,
      now,
    ],
  );
  return getWebhook(_id);
}

async function processWebhook(id) {
  const webhook = await getWebhook(id);
  if (!webhook || webhook.processed) return;

  try {
    if (webhook.source === 'payment' && webhook.event === 'payment.succeeded') {
      console.log('Processing payment success:', webhook.payload);
    } else if (webhook.source === 'cms' && webhook.event === 'content.updated') {
      console.log('Processing CMS update:', webhook.payload);
    }

    await query(
      'UPDATE webhooks SET processed = 1, processedAt = ?, updatedAt = ? WHERE _id = ?',
      [new Date(), new Date(), id],
    );
  } catch (error) {
    await query(
      'UPDATE webhooks SET error = ?, updatedAt = ? WHERE _id = ?',
      [error.message, new Date(), id],
    );
    throw error;
  }
}

async function listWebhooks({ limit = 20, skip = 0, source, processed } = {}) {
  const where = [];
  const values = [];
  if (source) {
    where.push('source = ?');
    values.push(source);
  }
  if (typeof processed === 'boolean') {
    where.push('processed = ?');
    values.push(processed ? 1 : 0);
  }
  values.push(Number(limit) || 20, Number(skip) || 0);
  const rows = await query(
    `SELECT * FROM webhooks
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    values,
  );
  return rows.map(mapWebhook);
}

async function getWebhook(id) {
  const rows = await query('SELECT * FROM webhooks WHERE _id = ? LIMIT 1', [id]);
  return mapWebhook(rows[0]);
}

module.exports = { createWebhook, processWebhook, listWebhooks, getWebhook };
