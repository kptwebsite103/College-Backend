const bcrypt = require('bcrypt');
const { query } = require('../../config/database');
const { buildUpdate, escapeLike, generateId, parseDate, parseJson, toBool, toJson, withId } = require('../../utils/mysql-utils');

function mapUserRow(row, { includePassword = false } = {}) {
  if (!row) return null;
  const user = withId({
    _id: row._id,
    username: row.username,
    email: row.email,
    firstName: row.firstName || null,
    lastName: row.lastName || null,
    roles: parseJson(row.roles, ['user']),
    isActive: toBool(row.isActive, true),
    departmentId: row.departmentId || null,
    lastLogin: parseDate(row.lastLogin),
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });

  if (includePassword) user.password = row.password;
  return user;
}

async function createUser(payload) {
  const now = new Date();
  const _id = generateId();
  const username = String(payload.username || '').trim().toLowerCase();
  const email = String(payload.email || payload.username || '').trim().toLowerCase();
  const password = payload.password ? await bcrypt.hash(payload.password, 12) : null;
  const roles = Array.isArray(payload.roles) && payload.roles.length ? payload.roles : ['user'];

  await query(
    `INSERT INTO users (_id, username, email, password, firstName, lastName, roles, isActive, departmentId, lastLogin, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      username,
      email,
      password,
      payload.firstName || null,
      payload.lastName || null,
      toJson(roles, ['user']),
      payload.isActive === false ? 0 : 1,
      payload.departmentId || null,
      now,
      now,
      now,
    ],
  );

  return getUser(_id);
}

async function listUsers({ limit = 20, skip = 0, active, q } = {}) {
  const where = [];
  const values = [];

  if (typeof active === 'boolean') {
    where.push('isActive = ?');
    values.push(active ? 1 : 0);
  }

  if (q) {
    const like = `%${escapeLike(q)}%`;
    where.push('(email LIKE ? OR firstName LIKE ? OR lastName LIKE ? OR username LIKE ?)');
    values.push(like, like, like, like);
  }

  values.push(Number(limit) || 20, Number(skip) || 0);

  const rows = await query(
    `SELECT * FROM users
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    values,
  );

  return rows.map((row) => mapUserRow(row));
}

async function getUser(id) {
  const rows = await query('SELECT * FROM users WHERE _id = ? LIMIT 1', [id]);
  return mapUserRow(rows[0]);
}

async function getUserWithPassword(id) {
  const rows = await query('SELECT * FROM users WHERE _id = ? LIMIT 1', [id]);
  return mapUserRow(rows[0], { includePassword: true });
}

async function findUserByUsernameEmail(username, email, { includePassword = false } = {}) {
  const rows = await query(
    'SELECT * FROM users WHERE username = ? AND email = ? LIMIT 1',
    [String(username || '').trim().toLowerCase(), String(email || '').trim().toLowerCase()],
  );
  return mapUserRow(rows[0], { includePassword });
}

async function findUserByUsernameOrEmail(username, email, { includePassword = false } = {}) {
  const rows = await query(
    'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
    [String(username || '').trim().toLowerCase(), String(email || '').trim().toLowerCase()],
  );
  return mapUserRow(rows[0], { includePassword });
}

async function findUserByUsername(username, { includePassword = false } = {}) {
  const rows = await query(
    'SELECT * FROM users WHERE username = ? LIMIT 1',
    [String(username || '').trim().toLowerCase()],
  );
  return mapUserRow(rows[0], { includePassword });
}

async function updateUser(id, payload) {
  const updatePayload = { ...payload };
  if (updatePayload.password) {
    updatePayload.password = await bcrypt.hash(updatePayload.password, 12);
  }
  if (updatePayload.roles !== undefined) {
    updatePayload.roles = toJson(updatePayload.roles, ['user']);
  }
  if (updatePayload.isActive !== undefined) {
    updatePayload.isActive = updatePayload.isActive ? 1 : 0;
  }
  if (updatePayload.email) {
    updatePayload.email = String(updatePayload.email).trim().toLowerCase();
  }
  if (updatePayload.username) {
    updatePayload.username = String(updatePayload.username).trim().toLowerCase();
  }

  const { set, values } = buildUpdate(
    { ...updatePayload, updatedAt: new Date() },
    [
      'username',
      'email',
      'password',
      'firstName',
      'lastName',
      'roles',
      'isActive',
      'departmentId',
      'lastLogin',
      'updatedAt',
    ],
  );

  if (!set.length) return getUser(id);

  await query(`UPDATE users SET ${set.join(', ')} WHERE _id = ?`, [...values, id]);
  return getUser(id);
}

async function deleteUser(id) {
  const doc = await getUser(id);
  if (!doc) return null;
  await query('DELETE FROM users WHERE _id = ?', [id]);
  return doc;
}

async function countUsers() {
  const rows = await query('SELECT COUNT(*) AS count FROM users');
  return Number(rows[0] && rows[0].count ? rows[0].count : 0);
}

module.exports = {
  countUsers,
  createUser,
  deleteUser,
  findUserByUsername,
  findUserByUsernameEmail,
  findUserByUsernameOrEmail,
  getUser,
  getUserWithPassword,
  listUsers,
  updateUser,
};
