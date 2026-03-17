const { query } = require('../../config/database');
const { generateId, parseDate, parseJson, toJson, withId } = require('../../utils/mysql-utils');

function mapActivity(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    actorId: row.actorId || null,
    actorEmail: row.actorEmail || null,
    action: row.action,
    resourceType: row.resourceType,
    resourceId: row.resourceId || null,
    before: parseJson(row.beforeData, null),
    after: parseJson(row.afterData, null),
    meta: parseJson(row.meta, {}),
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

async function createActivity(entry) {
  const _id = generateId();
  const now = new Date();
  await query(
    `INSERT INTO activities
      (_id, actorId, actorEmail, action, resourceType, resourceId, beforeData, afterData, meta, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      entry.actorId || null,
      entry.actorEmail || null,
      entry.action,
      entry.resourceType,
      entry.resourceId || null,
      toJson(entry.before, null),
      toJson(entry.after, null),
      toJson(entry.meta || {}),
      now,
      now,
    ],
  );

  const rows = await query('SELECT * FROM activities WHERE _id = ? LIMIT 1', [_id]);
  return mapActivity(rows[0]);
}

async function listActivities(filter = {}, options = {}) {
  const where = [];
  const values = [];
  if (filter.resourceType) {
    where.push('resourceType = ?');
    values.push(filter.resourceType);
  }
  if (filter.resourceId) {
    where.push('resourceId = ?');
    values.push(filter.resourceId);
  }
  if (filter.actorId) {
    where.push('actorId = ?');
    values.push(filter.actorId);
  }

  const limit = Number(options.limit) || 100;
  const skip = Number(options.skip) || 0;
  values.push(limit, skip);

  const rows = await query(
    `SELECT * FROM activities
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    values,
  );

  return rows.map(mapActivity);
}

module.exports = { createActivity, listActivities };
