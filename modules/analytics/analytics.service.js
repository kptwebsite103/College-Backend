const { query } = require('../../config/database');
const { generateId, parseDate, parseJson, toJson, withId } = require('../../utils/mysql-utils');

function mapAnalytics(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    event: row.event,
    data: parseJson(row.data, {}),
    userId: row.userId || null,
    sessionId: row.sessionId || null,
    ip: row.ip || null,
    userAgent: row.userAgent || null,
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

function normalizeGroupBy(groupBy) {
  if (groupBy === 'hour') return '%Y-%m-%d %H';
  if (groupBy === 'month') return '%Y-%m';
  return '%Y-%m-%d';
}

function addDateFilter(where, values, startDate, endDate) {
  if (startDate) {
    where.push('createdAt >= ?');
    values.push(new Date(startDate));
  }
  if (endDate) {
    where.push('createdAt <= ?');
    values.push(new Date(endDate));
  }
}

async function createAnalytics(payload) {
  const _id = generateId();
  const now = new Date();
  await query(
    `INSERT INTO analytics (_id, event, data, userId, sessionId, ip, userAgent, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      payload.event,
      toJson(payload.data || {}),
      payload.userId || null,
      payload.sessionId || null,
      payload.ip || null,
      payload.userAgent || null,
      now,
      now,
    ],
  );
  return getAnalytics(_id);
}

async function listAnalytics({ limit = 20, skip = 0, event, userId, sessionId } = {}) {
  const where = [];
  const values = [];
  if (event) {
    where.push('event = ?');
    values.push(event);
  }
  if (userId) {
    where.push('userId = ?');
    values.push(userId);
  }
  if (sessionId) {
    where.push('sessionId = ?');
    values.push(sessionId);
  }
  values.push(Number(limit) || 20, Number(skip) || 0);
  const rows = await query(
    `SELECT * FROM analytics
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    values,
  );
  return rows.map(mapAnalytics);
}

async function getAnalytics(id) {
  const rows = await query('SELECT * FROM analytics WHERE _id = ? LIMIT 1', [id]);
  return mapAnalytics(rows[0]);
}

async function getPageViewsReport({ startDate, endDate, groupBy = 'day' } = {}) {
  const where = ['event = ?'];
  const values = ['page_view'];
  addDateFilter(where, values, startDate, endDate);
  const fmt = normalizeGroupBy(groupBy);

  const rows = await query(
    `SELECT
       DATE_FORMAT(createdAt, ?) AS date,
       COUNT(*) AS count,
       COUNT(DISTINCT userId) AS uniqueUsers,
       COUNT(DISTINCT sessionId) AS uniqueSessions
     FROM analytics
     WHERE ${where.join(' AND ')}
     GROUP BY DATE_FORMAT(createdAt, ?)
     ORDER BY date ASC`,
    [fmt, ...values, fmt],
  );

  return rows.map((row) => ({
    date: row.date,
    count: Number(row.count || 0),
    uniqueUsers: Number(row.uniqueUsers || 0),
    uniqueSessions: Number(row.uniqueSessions || 0),
  }));
}

async function getUserActivityReport({ startDate, endDate, userId, groupBy = 'day' } = {}) {
  const where = ['event = ?'];
  const values = ['user_activity'];
  if (userId) {
    where.push('userId = ?');
    values.push(userId);
  }
  addDateFilter(where, values, startDate, endDate);
  const fmt = normalizeGroupBy(groupBy);

  const rows = await query(
    `SELECT
       DATE_FORMAT(createdAt, ?) AS date,
       COUNT(*) AS count,
       COUNT(DISTINCT userId) AS uniqueUsers,
       JSON_ARRAYAGG(JSON_UNQUOTE(JSON_EXTRACT(data, '$.action'))) AS actions
     FROM analytics
     WHERE ${where.join(' AND ')}
     GROUP BY DATE_FORMAT(createdAt, ?)
     ORDER BY date ASC`,
    [fmt, ...values, fmt],
  );

  return rows.map((row) => ({
    date: row.date,
    count: Number(row.count || 0),
    uniqueUsers: Number(row.uniqueUsers || 0),
    actions: parseJson(row.actions, []).filter((a) => a !== null),
  }));
}

async function getGeneralReport({ startDate, endDate } = {}) {
  const where = [];
  const values = [];
  addDateFilter(where, values, startDate, endDate);

  const rows = await query(
    `SELECT
       event,
       COUNT(*) AS count,
       COUNT(DISTINCT userId) AS uniqueUsers,
       COUNT(DISTINCT sessionId) AS uniqueSessions
     FROM analytics
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     GROUP BY event
     ORDER BY count DESC`,
    values,
  );

  return rows.map((row) => ({
    event: row.event,
    count: Number(row.count || 0),
    uniqueUsers: Number(row.uniqueUsers || 0),
    uniqueSessions: Number(row.uniqueSessions || 0),
  }));
}

module.exports = { createAnalytics, listAnalytics, getAnalytics, getPageViewsReport, getUserActivityReport, getGeneralReport };
