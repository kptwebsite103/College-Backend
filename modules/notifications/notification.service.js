const { query } = require('../../config/database');
const { generateId, parseDate, parseJson, toBool, toJson, withId } = require('../../utils/mysql-utils');
const { emitNotification } = require('../../sockets/analytics.socket');

function mapNotification(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    userId: row.userId || null,
    title: row.title,
    message: row.message,
    type: row.type || 'info',
    read: toBool(row.read, false),
    data: parseJson(row.data, {}),
    recipients: parseJson(row.recipients, []),
    status: row.status || null,
    error: row.error || null,
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

async function getNotificationById(id) {
  const rows = await query('SELECT * FROM notifications WHERE _id = ? LIMIT 1', [id]);
  return mapNotification(rows[0]);
}

async function updateNotification(id, payload) {
  const fields = [];
  const values = [];

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    fields.push('title = ?');
    values.push(payload.title);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'message')) {
    fields.push('message = ?');
    values.push(payload.message);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'type')) {
    fields.push('type = ?');
    values.push(payload.type);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'read')) {
    fields.push('`read` = ?');
    values.push(payload.read ? 1 : 0);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'data')) {
    fields.push('data = ?');
    values.push(toJson(payload.data || {}));
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'recipients')) {
    fields.push('recipients = ?');
    values.push(toJson(payload.recipients || []));
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    fields.push('status = ?');
    values.push(payload.status);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'error')) {
    fields.push('error = ?');
    values.push(payload.error || null);
  }

  fields.push('updatedAt = ?');
  values.push(new Date());

  await query(`UPDATE notifications SET ${fields.join(', ')} WHERE _id = ?`, [...values, id]);
  return getNotificationById(id);
}

async function createNotification(payload) {
  const _id = generateId();
  const now = new Date();
  await query(
    `INSERT INTO notifications
      (_id, userId, title, message, type, \`read\`, data, recipients, status, error, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      payload.userId || null,
      payload.title || '',
      payload.message || '',
      payload.type || 'info',
      payload.read ? 1 : 0,
      toJson(payload.data || {}),
      toJson(payload.recipients || []),
      payload.status || null,
      payload.error || null,
      now,
      now,
    ],
  );

  const saved = await getNotificationById(_id);
  if (saved && saved.userId) {
    emitNotification(saved.userId, saved);
  }
  return saved;
}

async function listNotifications(userId, { limit = 20, skip = 0, read } = {}) {
  const where = ['userId = ?'];
  const values = [userId];
  if (typeof read === 'boolean') {
    where.push('`read` = ?');
    values.push(read ? 1 : 0);
  }
  values.push(Number(limit) || 20, Number(skip) || 0);

  const rows = await query(
    `SELECT * FROM notifications
     WHERE ${where.join(' AND ')}
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    values,
  );
  return rows.map(mapNotification);
}

async function markAsRead(id, userId) {
  const rows = await query('SELECT _id FROM notifications WHERE _id = ? AND userId = ? LIMIT 1', [id, userId]);
  if (!rows.length) return null;
  return updateNotification(id, { read: true });
}

async function getNotification(id, userId) {
  const rows = await query('SELECT * FROM notifications WHERE _id = ? AND userId = ? LIMIT 1', [id, userId]);
  return mapNotification(rows[0]);
}

async function sendExternalNotification({ type, recipients, data }) {
  const saved = await createNotification({
    type,
    recipients,
    data,
    title: data && data.title ? data.title : 'External notification',
    message: data && data.message ? data.message : '',
    status: 'pending',
  });

  const notificationQueue = require('../../queues/notification.queue');
  await notificationQueue.add({
    notificationId: saved._id,
    type,
    recipients,
    data
  });

  return saved;
}

module.exports = {
  createNotification,
  getNotification,
  getNotificationById,
  listNotifications,
  markAsRead,
  sendExternalNotification,
  updateNotification,
};
