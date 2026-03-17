const crypto = require('crypto');

function generateId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString('hex');
}

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
}

function toJson(value, fallback = null) {
  if (value === undefined) value = fallback;
  return JSON.stringify(value);
}

function toBool(value, fallback = false) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return fallback;
}

function parseDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function escapeLike(term) {
  return String(term).replace(/[\\%_]/g, '\\$&');
}

function withId(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  if (doc._id && !doc.id) doc.id = doc._id;
  if (doc.id && !doc._id) doc._id = doc.id;
  return doc;
}

function buildUpdate(payload, allowedKeys, transforms = {}) {
  const set = [];
  const values = [];

  for (const key of allowedKeys) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
    set.push(`\`${key}\` = ?`);
    const transform = transforms[key];
    values.push(transform ? transform(payload[key]) : payload[key]);
  }

  return { set, values };
}

module.exports = {
  buildUpdate,
  escapeLike,
  generateId,
  parseDate,
  parseJson,
  toBool,
  toJson,
  withId,
};
