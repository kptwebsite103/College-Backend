const { query } = require('../../config/database');
const { buildUpdate, escapeLike, generateId, parseDate, parseJson, toBool, toJson, withId } = require('../../utils/mysql-utils');

function mapUser(row) {
  if (!row) return null;
  return withId({
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
}

function mapDepartment(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    name: parseJson(row.name, {}),
    slug: row.slug,
    description: parseJson(row.description, {}),
    faculty: parseJson(row.faculty, []),
    active: toBool(row.active, true),
    order: Number(row.order_no || 0),
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

async function attachFaculty(departments) {
  if (!departments.length) return departments;

  const ids = Array.from(new Set(
    departments.flatMap((d) => Array.isArray(d.faculty) ? d.faculty : []).filter(Boolean),
  ));

  if (!ids.length) {
    return departments.map((d) => ({ ...d, faculty: [] }));
  }

  const placeholders = ids.map(() => '?').join(', ');
  const rows = await query(`SELECT * FROM users WHERE _id IN (${placeholders})`, ids);
  const byId = new Map(rows.map((row) => [row._id, mapUser(row)]));

  return departments.map((dept) => ({
    ...dept,
    faculty: (Array.isArray(dept.faculty) ? dept.faculty : [])
      .map((id) => byId.get(id))
      .filter(Boolean),
  }));
}

async function createDepartment(payload) {
  const now = new Date();
  const _id = generateId();
  await query(
    `INSERT INTO departments (_id, name, slug, description, faculty, active, order_no, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      toJson(payload.name || {}),
      payload.slug,
      toJson(payload.description || {}),
      toJson(payload.faculty || []),
      payload.active === false ? 0 : 1,
      Number(payload.order || 0),
      now,
      now,
    ],
  );
  return getDepartment(_id);
}

async function listDepartments({ limit = 20, skip = 0, active, q } = {}) {
  const where = [];
  const values = [];

  if (typeof active === 'boolean') {
    where.push('active = ?');
    values.push(active ? 1 : 0);
  }
  if (q) {
    where.push('JSON_UNQUOTE(JSON_EXTRACT(name, "$.en")) LIKE ?');
    values.push(`%${escapeLike(q)}%`);
  }

  values.push(Number(limit) || 20, Number(skip) || 0);
  const rows = await query(
    `SELECT * FROM departments
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY order_no ASC, createdAt DESC
     LIMIT ? OFFSET ?`,
    values,
  );

  return attachFaculty(rows.map(mapDepartment));
}

async function getDepartment(id) {
  const rows = await query('SELECT * FROM departments WHERE _id = ? LIMIT 1', [id]);
  const doc = mapDepartment(rows[0]);
  if (!doc) return null;
  const [withFaculty] = await attachFaculty([doc]);
  return withFaculty;
}

async function getDepartmentBySlug(slug) {
  const rows = await query('SELECT * FROM departments WHERE slug = ? LIMIT 1', [slug]);
  const doc = mapDepartment(rows[0]);
  if (!doc) return null;
  const [withFaculty] = await attachFaculty([doc]);
  return withFaculty;
}

async function updateDepartment(id, payload) {
  const source = { ...payload, updatedAt: new Date() };
  if (Object.prototype.hasOwnProperty.call(source, 'order')) {
    source.order_no = source.order;
    delete source.order;
  }

  const transforms = {
    name: (v) => toJson(v || {}),
    description: (v) => toJson(v || {}),
    faculty: (v) => toJson(v || []),
    active: (v) => (v ? 1 : 0),
    order_no: (v) => Number(v || 0),
  };

  const { set, values } = buildUpdate(
    source,
    ['name', 'slug', 'description', 'faculty', 'active', 'order_no', 'updatedAt'],
    transforms,
  );

  if (set.length) {
    await query(`UPDATE departments SET ${set.join(', ')} WHERE _id = ?`, [...values, id]);
  }
  return getDepartment(id);
}

async function getFaculty(departmentId) {
  const rows = await query(
    `SELECT * FROM users
     WHERE departmentId = ?
       AND JSON_CONTAINS(roles, '"faculty"')
     ORDER BY createdAt DESC`,
    [departmentId],
  );
  return rows.map(mapUser);
}

async function removeDepartment(id) {
  const doc = await getDepartment(id);
  if (!doc) return null;
  await query('DELETE FROM departments WHERE _id = ?', [id]);
  return doc;
}

module.exports = { createDepartment, listDepartments, getDepartment, getDepartmentBySlug, getFaculty, updateDepartment, removeDepartment };
