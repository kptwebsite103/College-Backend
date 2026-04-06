const { query } = require('../../config/database');
const { buildUpdate, escapeLike, generateId, parseDate, parseJson, toBool, toJson, withId } = require('../../utils/mysql-utils');

function mapHomeSection(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    type: row.type,
    title: parseJson(row.title, {}),
    active: toBool(row.active, true),
    order: Number(row.order_no || 0),
    departmentId: row.departmentId || null,
    heroHeading: parseJson(row.heroHeading, {}),
    heroDescription: parseJson(row.heroDescription, {}),
    heroHeadingSize: row.heroHeadingSize == null ? null : Number(row.heroHeadingSize),
    heroTextAlign: row.heroTextAlign || null,
    bannerImage: row.bannerImage || null,
    bannerDescription: parseJson(row.bannerDescription, {}),
    bannerLink: row.bannerLink || null,
    slides: parseJson(row.slides, []),
    blockContent: parseJson(row.blockContent, {}),
    pageSlug: row.pageSlug || null,
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

async function createHomeSection(payload) {
  const now = new Date();
  const _id = generateId();
  await query(
    `INSERT INTO home_sections
      (_id, type, title, active, order_no, departmentId, heroHeading, heroDescription, heroHeadingSize, heroTextAlign,
       bannerImage, bannerDescription, bannerLink, slides, blockContent, pageSlug, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      payload.type,
      toJson(payload.title || {}),
      payload.active === false ? 0 : 1,
      Number(payload.order || 0),
      payload.departmentId || null,
      toJson(payload.heroHeading || {}),
      toJson(payload.heroDescription || {}),
      payload.heroHeadingSize == null ? null : Number(payload.heroHeadingSize),
      payload.heroTextAlign || null,
      payload.bannerImage || null,
      toJson(payload.bannerDescription || {}),
      payload.bannerLink || null,
      toJson(payload.slides || []),
      toJson(payload.blockContent || {}),
      payload.pageSlug || null,
      now,
      now,
    ],
  );
  return getHomeSection(_id);
}

async function listHomeSections({ limit = 20, skip = 0, q, active, type, departmentId } = {}) {
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
  if (departmentId) {
    where.push('departmentId = ?');
    values.push(departmentId);
  }
  if (q) {
    where.push('JSON_UNQUOTE(JSON_EXTRACT(title, "$.en")) LIKE ?');
    values.push(`%${escapeLike(q)}%`);
  }

  values.push(Number(limit) || 20, Number(skip) || 0);

  const rows = await query(
    `SELECT * FROM home_sections
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY order_no ASC, createdAt DESC
     LIMIT ? OFFSET ?`,
    values,
  );
  return rows.map(mapHomeSection);
}

async function getHomeSection(id) {
  const rows = await query('SELECT * FROM home_sections WHERE _id = ? LIMIT 1', [id]);
  return mapHomeSection(rows[0]);
}

async function updateHomeSection(id, payload) {
  const source = { ...payload, updatedAt: new Date() };
  if (Object.prototype.hasOwnProperty.call(source, 'order')) {
    source.order_no = source.order;
    delete source.order;
  }

  const transforms = {
    title: (v) => toJson(v || {}),
    active: (v) => (v ? 1 : 0),
    order_no: (v) => Number(v || 0),
    heroHeading: (v) => toJson(v || {}),
    heroDescription: (v) => toJson(v || {}),
    bannerDescription: (v) => toJson(v || {}),
    slides: (v) => toJson(v || []),
    blockContent: (v) => toJson(v || {}),
  };

  const { set, values } = buildUpdate(
    source,
    [
      'type',
      'title',
      'active',
      'order_no',
      'departmentId',
      'heroHeading',
      'heroDescription',
      'heroHeadingSize',
      'heroTextAlign',
      'bannerImage',
      'bannerDescription',
      'bannerLink',
      'slides',
      'blockContent',
      'pageSlug',
      'updatedAt',
    ],
    transforms,
  );

  if (set.length) {
    await query(`UPDATE home_sections SET ${set.join(', ')} WHERE _id = ?`, [...values, id]);
  }
  return getHomeSection(id);
}

async function removeHomeSection(id) {
  const doc = await getHomeSection(id);
  if (!doc) return null;
  await query('DELETE FROM home_sections WHERE _id = ?', [id]);
  return doc;
}

async function getActiveHomeSections(departmentId, type) {
  const where = ['active = 1'];
  const values = [];
  if (departmentId) {
    where.push('departmentId = ?');
    values.push(departmentId);
  }
  if (type) {
    where.push('type = ?');
    values.push(type);
  }

  const rows = await query(
    `SELECT * FROM home_sections
     WHERE ${where.join(' AND ')}
     ORDER BY order_no ASC, type ASC`,
    values,
  );
  return rows.map(mapHomeSection);
}

module.exports = {
  createHomeSection,
  listHomeSections,
  getHomeSection,
  updateHomeSection,
  removeHomeSection,
  getActiveHomeSections
};
