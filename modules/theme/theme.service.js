const { query } = require('../../config/database');
const { buildUpdate, generateId, parseDate, parseJson, toBool, toJson, withId } = require('../../utils/mysql-utils');

function mapTheme(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    type: row.type,
    colors: parseJson(row.colors, {}),
    contact: parseJson(row.contact, {}),
    active: toBool(row.active, true),
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

async function createTheme(payload) {
  const now = new Date();
  const _id = generateId();

  await query(
    `INSERT INTO themes (_id, type, colors, contact, active, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      payload.type,
      toJson(payload.colors || {}),
      toJson(payload.contact || {}),
      payload.active === false ? 0 : 1,
      now,
      now,
    ],
  );

  return getTheme(payload.type);
}

async function getTheme(type) {
  const rows = await query(
    'SELECT * FROM themes WHERE type = ? AND active = 1 ORDER BY updatedAt DESC LIMIT 1',
    [type],
  );
  return mapTheme(rows[0]);
}

async function updateTheme(type, payload) {
  const existing = await query('SELECT _id FROM themes WHERE type = ? LIMIT 1', [type]);

  if (!existing.length) {
    return createTheme({ ...payload, type });
  }

  const updateSource = {
    updatedAt: new Date(),
  };

  if (payload.colors !== undefined) {
    updateSource.colors = toJson(payload.colors || {});
  }
  if (payload.contact !== undefined) {
    updateSource.contact = toJson(payload.contact || {});
  }
  if (payload.active !== undefined) {
    updateSource.active = payload.active ? 1 : 0;
  }

  const { set, values } = buildUpdate(updateSource, [
    'colors',
    'contact',
    'active',
    'updatedAt',
  ]);

  if (set.length) {
    await query(`UPDATE themes SET ${set.join(', ')} WHERE type = ?`, [...values, type]);
  }

  const rows = await query('SELECT * FROM themes WHERE type = ? LIMIT 1', [type]);
  return mapTheme(rows[0]);
}

async function listThemes() {
  const rows = await query('SELECT * FROM themes WHERE active = 1 ORDER BY updatedAt DESC');
  return rows.map(mapTheme);
}

module.exports = { createTheme, getTheme, listThemes, updateTheme };
