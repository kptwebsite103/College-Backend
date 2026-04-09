const { query } = require('../../config/database');
const { buildUpdate, escapeLike, generateId, parseDate, parseJson, toBool, toJson, withId } = require('../../utils/mysql-utils');

function mapMenu(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    name: parseJson(row.name, {}),
    slug: row.slug,
    type: row.type || 'navigation',
    url: row.url || null,
    redirect_url: row.redirect_url || null,
    items: parseJson(row.items, []),
    status: row.status || 'Created',
    active: toBool(row.active, true),
    order: Number(row.order_no || 0),
    departmentId: row.departmentId || null,
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

function normalizeOrder(order, fallback = 1) {
  const value = Number(order);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

async function getNextAvailableNavigationOrder(requestedOrder, excludeId) {
  const rows = await query(
    `SELECT order_no FROM menus WHERE type = 'navigation' ${excludeId ? 'AND _id <> ?' : ''}`,
    excludeId ? [excludeId] : [],
  );

  const taken = new Set(
    rows
      .map((row) => Number(row.order_no))
      .filter((order) => Number.isInteger(order) && order > 0),
  );

  let next = normalizeOrder(requestedOrder, 1);
  while (taken.has(next)) {
    next += 1;
  }
  return next;
}

async function slugExists(slug, excludeId) {
  if (!slug) return false;
  const rows = await query(
    `SELECT _id FROM menus WHERE slug = ? ${excludeId ? 'AND _id <> ?' : ''} LIMIT 1`,
    excludeId ? [slug, excludeId] : [slug],
  );
  return rows.length > 0;
}

async function createMenu(payload) {
  if (payload && payload.slug && await slugExists(payload.slug)) {
    const err = new Error('Slug already exists');
    err.status = 409;
    throw err;
  }

  const now = new Date();
  const _id = generateId();
  const menuType = payload.type || 'navigation';
  const orderNo =
    menuType === 'navigation'
      ? await getNextAvailableNavigationOrder(payload.order)
      : Number(payload.order || 0);

  await query(
    `INSERT INTO menus
      (_id, name, slug, type, url, redirect_url, items, status, active, order_no, departmentId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      toJson(payload.name || {}),
      payload.slug,
      menuType,
      payload.url || null,
      payload.redirect_url || null,
      toJson(payload.items || []),
      payload.status || 'Created',
      payload.active === false ? 0 : 1,
      orderNo,
      payload.departmentId || null,
      now,
      now,
    ],
  );

  return getMenu(_id);
}

async function listMenus({ limit = 20, skip = 0, q, active, type, status } = {}) {
  const where = [];
  const values = [];

  if (typeof active === 'boolean') {
    where.push('active = ?');
    values.push(active ? 1 : 0);
  }
  if (type) {
    where.push('type = ?');
    values.push(type);
  }
  if (status) {
    where.push('status = ?');
    values.push(status);
  }
  if (q) {
    where.push('JSON_UNQUOTE(JSON_EXTRACT(name, "$.en")) LIKE ?');
    values.push(`%${escapeLike(q)}%`);
  }

  values.push(Number(limit) || 20, Number(skip) || 0);

  const rows = await query(
    `SELECT * FROM menus
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY order_no ASC, createdAt DESC
     LIMIT ? OFFSET ?`,
    values,
  );

  return rows.map(mapMenu);
}

async function getMenu(id) {
  const rows = await query('SELECT * FROM menus WHERE _id = ? LIMIT 1', [id]);
  return mapMenu(rows[0]);
}

async function updateMenu(id, payload) {
  const currentRows = await query('SELECT _id, type, order_no FROM menus WHERE _id = ? LIMIT 1', [id]);
  if (!currentRows.length) return null;
  const current = currentRows[0];
  const currentType = current.type || 'navigation';

  if (payload && payload.slug && await slugExists(payload.slug, id)) {
    const err = new Error('Slug already exists');
    err.status = 409;
    throw err;
  }

  const source = { ...payload, updatedAt: new Date() };
  if (Object.prototype.hasOwnProperty.call(source, 'order')) {
    source.order_no = source.order;
    delete source.order;
  }

  const nextType = source.type || currentType;
  if (nextType === 'navigation') {
    const hasRequestedOrder = Object.prototype.hasOwnProperty.call(source, 'order_no');
    const requestedOrder = hasRequestedOrder
      ? source.order_no
      : Number(current.order_no) > 0
        ? Number(current.order_no)
        : undefined;
    source.order_no = await getNextAvailableNavigationOrder(requestedOrder, id);
  } else if (Object.prototype.hasOwnProperty.call(source, 'order_no')) {
    source.order_no = Number(source.order_no || 0);
  }

  const transforms = {
    name: (v) => toJson(v || {}),
    items: (v) => toJson(v || []),
    active: (v) => (v ? 1 : 0),
    order_no: (v) => Number(v || 0),
  };

  const { set, values } = buildUpdate(
    source,
    ['name', 'slug', 'type', 'url', 'redirect_url', 'items', 'status', 'active', 'order_no', 'departmentId', 'updatedAt'],
    transforms,
  );

  if (!set.length) return getMenu(id);

  await query(`UPDATE menus SET ${set.join(', ')} WHERE _id = ?`, [...values, id]);
  return getMenu(id);
}

async function removeMenu(id) {
  const doc = await getMenu(id);
  if (!doc) return null;
  await query('DELETE FROM menus WHERE _id = ?', [id]);
  return doc;
}

async function setMenuStatus(id, { status, active }) {
  await query('UPDATE menus SET status = ?, active = ?, updatedAt = ? WHERE _id = ?', [
    status,
    active ? 1 : 0,
    new Date(),
    id,
  ]);
  return getMenu(id);
}

module.exports = {
  createMenu,
  getMenu,
  listMenus,
  removeMenu,
  setMenuStatus,
  updateMenu,
};
