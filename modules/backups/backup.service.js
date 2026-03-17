const { query } = require('../../config/database');
const { generateId, parseDate, withId } = require('../../utils/mysql-utils');

function mapBackup(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    name: row.name,
    path: row.path || null,
    filePath: row.filePath || null,
    size: row.size == null ? null : Number(row.size),
    status: row.status || 'pending',
    createdBy: row.createdBy || null,
    type: row.type || null,
    error: row.error || null,
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

async function getBackup(id) {
  const rows = await query('SELECT * FROM backups WHERE _id = ? LIMIT 1', [id]);
  return mapBackup(rows[0]);
}

async function updateBackup(id, payload) {
  const fields = [];
  const values = [];

  const mapping = ['name', 'path', 'filePath', 'size', 'status', 'createdBy', 'type', 'error'];
  for (const key of mapping) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
    fields.push(`\`${key}\` = ?`);
    values.push(payload[key]);
  }
  fields.push('updatedAt = ?');
  values.push(new Date());

  await query(`UPDATE backups SET ${fields.join(', ')} WHERE _id = ?`, [...values, id]);
  return getBackup(id);
}

async function createBackup(payload) {
  const _id = generateId();
  const now = new Date();
  await query(
    `INSERT INTO backups (_id, name, path, filePath, size, status, createdBy, type, error, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      payload.name,
      payload.path || null,
      payload.filePath || null,
      payload.size == null ? null : Number(payload.size),
      payload.status || 'pending',
      payload.createdBy || null,
      payload.type || 'database',
      payload.error || null,
      now,
      now,
    ],
  );

  const savedBackup = await getBackup(_id);

  const backupQueue = require('../../queues/backup.queue');
  await backupQueue.add({ backupId: savedBackup._id, type: payload.type || 'database' });

  return savedBackup;
}

async function listBackups({ limit = 20, skip = 0, status } = {}) {
  const where = [];
  const values = [];
  if (status) {
    where.push('status = ?');
    values.push(status);
  }
  values.push(Number(limit) || 20, Number(skip) || 0);
  const rows = await query(
    `SELECT * FROM backups
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    values,
  );
  return rows.map(mapBackup);
}

module.exports = { createBackup, listBackups, getBackup, updateBackup };
