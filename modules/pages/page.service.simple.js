const { query } = require('../../config/database');
const slugify = require('../../utils/slugify');
const { buildUpdate, generateId, parseDate, parseJson, toJson, withId } = require('../../utils/mysql-utils');

function normalizeStatus(status, fallback = 'created') {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return fallback;
  if (value === 'created' || value === 'review') return 'pending';
  if (value === 'approved' || value === 'published' || value === 'pending' || value === 'rejected' || value === 'draft' || value === 'archived') {
    return value;
  }
  return fallback;
}

function normalizeLocaleContent(value) {
  if (typeof value === 'string') {
    return { html: value, javascript: '' };
  }
  if (value && typeof value === 'object') {
    return {
      html: typeof value.html === 'string' ? value.html : '',
      javascript: typeof value.javascript === 'string' ? value.javascript : '',
    };
  }
  return { html: '', javascript: '' };
}

function normalizeContent(content) {
  const source = content && typeof content === 'object' ? content : {};
  return {
    en: normalizeLocaleContent(source.en),
    kn: normalizeLocaleContent(source.kn),
  };
}

function mapPage(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    title: parseJson(row.title, { en: '', kn: '' }),
    slug: row.slug,
    redirect_url: row.redirect_url || '',
    css: row.css || '',
    content: normalizeContent(
      parseJson(row.content, { en: { html: '', javascript: '' }, kn: { html: '', javascript: '' } }),
    ),
    status: normalizeStatus(row.status, 'created'),
    departmentId: row.departmentId || null,
    author: row.author || null,
    updatedBy: row.updatedBy || null,
    publishedAt: parseDate(row.publishedAt),
    scheduledAt: parseDate(row.scheduledAt),
    versions: parseJson(row.versions, []),
    tags: parseJson(row.tags, []),
    announcement: parseJson(row.announcement, null),
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

async function slugExists(slug, excludeId) {
  const rows = await query(
    `SELECT _id FROM pages WHERE slug = ? ${excludeId ? 'AND _id <> ?' : ''} LIMIT 1`,
    excludeId ? [slug, excludeId] : [slug],
  );
  return rows.length > 0;
}

async function createPage(data) {
  const payload = { ...data };
  if (!payload.slug || !String(payload.slug).trim()) {
    payload.slug = slugify(payload.title && payload.title.en ? payload.title.en : 'page');
  }

  const base = payload.slug;
  let suffix = 0;
  while (await slugExists(payload.slug)) {
    suffix += 1;
    payload.slug = `${base}-${suffix}`;
  }

  const now = new Date();
  const _id = generateId();
  await query(
    `INSERT INTO pages
      (_id, title, slug, redirect_url, css, content, status, departmentId, author, updatedBy, publishedAt, scheduledAt, versions, tags, announcement, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      toJson(payload.title || { en: '', kn: '' }),
      payload.slug,
      payload.redirect_url || '',
      payload.css || '',
      toJson(normalizeContent(payload.content || { en: { html: '', javascript: '' }, kn: { html: '', javascript: '' } })),
      normalizeStatus(payload.status, 'created'),
      payload.departmentId || null,
      payload.author || null,
      payload.updatedBy || null,
      payload.publishedAt ? new Date(payload.publishedAt) : null,
      payload.scheduledAt ? new Date(payload.scheduledAt) : null,
      toJson(payload.versions || []),
      toJson(payload.tags || []),
      toJson(payload.announcement || null),
      now,
      now,
    ],
  );

  return getPageById(_id);
}

async function listPages(filter = {}, options = {}) {
  const where = [];
  const values = [];
  if (filter.status) {
    where.push('status = ?');
    values.push(filter.status);
  }
  if (filter.departmentId) {
    where.push('departmentId = ?');
    values.push(filter.departmentId);
  }
  if (filter.slug) {
    where.push('slug = ?');
    values.push(filter.slug);
  }

  const limit = Number(options.limit) || 50;
  const skip = Number(options.skip) || 0;
  values.push(limit, skip);

  const rows = await query(
    `SELECT * FROM pages
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    values,
  );
  return rows.map(mapPage);
}

function isAnnouncementTag(tags) {
  return Array.isArray(tags) && tags.some((tag) => String(tag).toLowerCase() === 'announcement');
}

function isAnnouncementActive(page, now) {
  const announcement = page.announcement || {};
  const startDate = announcement.startDate ? new Date(announcement.startDate) : null;
  const endDate = announcement.endDate ? new Date(announcement.endDate) : null;

  if (startDate && !Number.isNaN(startDate.getTime()) && startDate > now) return false;
  if (endDate && !Number.isNaN(endDate.getTime()) && endDate < now) return false;
  return true;
}

async function listPublicAnnouncements(options = {}) {
  const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : 6;
  const skip = Number.isFinite(Number(options.skip)) ? Number(options.skip) : 0;
  const now = new Date();

  const rows = await query(
    `SELECT * FROM pages
     WHERE LOWER(status) IN ('approved', 'published')
     ORDER BY publishedAt DESC, createdAt DESC
     LIMIT 500`,
  );

  const all = rows
    .map(mapPage)
    .filter((page) => isAnnouncementTag(page.tags) || String(page.slug || '').toLowerCase().includes('announcement'))
    .filter((page) => isAnnouncementActive(page, now));

  return all.slice(skip, skip + limit);
}

async function getPageById(id) {
  const rows = await query('SELECT * FROM pages WHERE _id = ? LIMIT 1', [id]);
  return mapPage(rows[0]);
}

async function getPageBySlug(slug) {
  const slugWithSlash = String(slug || '').startsWith('/') ? String(slug) : `/${slug}`;
  const slugWithoutSlash = String(slug || '').startsWith('/') ? String(slug).slice(1) : String(slug);

  let rows = await query(
    `SELECT * FROM pages
     WHERE slug = ? AND LOWER(status) IN ('approved', 'published')
     LIMIT 1`,
    [slugWithSlash],
  );
  if (rows.length) return mapPage(rows[0]);

  rows = await query(
    `SELECT * FROM pages
     WHERE slug = ? AND LOWER(status) IN ('approved', 'published')
     LIMIT 1`,
    [slugWithoutSlash],
  );
  return mapPage(rows[0]);
}

async function updatePage(id, update) {
  const existing = await getPageById(id);
  if (!existing) return null;

  if (update.slug && update.slug !== existing.slug) {
    if (await slugExists(update.slug, id)) {
      const err = new Error('Slug already exists');
      err.status = 409;
      throw err;
    }
  }

  const source = { ...update, updatedAt: new Date() };

  // Keep lightweight version history for content/title edits.
  if (update.title || update.content) {
    const versions = Array.isArray(existing.versions) ? [...existing.versions] : [];
    versions.push({
      title: existing.title,
      content: existing.content,
      updatedAt: new Date(),
      updatedBy: update.updatedBy || existing.updatedBy || null,
      note: update.note || null,
    });
    source.versions = versions;
  }

  const transforms = {
    title: (v) => toJson(v || { en: '', kn: '' }),
    content: (v) => toJson(normalizeContent(v || { en: { html: '', javascript: '' }, kn: { html: '', javascript: '' } })),
    versions: (v) => toJson(v || []),
    tags: (v) => toJson(v || []),
    announcement: (v) => toJson(v || null),
    status: (v) => normalizeStatus(v, existing.status || 'created'),
  };

  const { set, values } = buildUpdate(
    source,
    [
      'title',
      'slug',
      'redirect_url',
      'css',
      'content',
      'status',
      'departmentId',
      'author',
      'updatedBy',
      'publishedAt',
      'scheduledAt',
      'versions',
      'tags',
      'announcement',
      'updatedAt',
    ],
    transforms,
  );

  if (set.length) {
    await query(`UPDATE pages SET ${set.join(', ')} WHERE _id = ?`, [...values, id]);
  }

  return getPageById(id);
}

async function deletePage(id) {
  await query('DELETE FROM pages WHERE _id = ?', [id]);
  return { deleted: 1 };
}

async function publishPage(id, updatedBy) {
  return updatePage(id, { status: 'approved', publishedAt: new Date(), updatedBy: updatedBy || null });
}

async function unpublishPage(id, updatedBy) {
  return updatePage(id, { status: 'draft', publishedAt: null, updatedBy: updatedBy || null });
}

async function rejectPage(id, updatedBy) {
  return updatePage(id, { status: 'rejected', updatedBy: updatedBy || null });
}

async function schedulePage(id, scheduledAt, updatedBy) {
  return updatePage(id, { scheduledAt, updatedBy: updatedBy || null });
}

async function rollbackPage(id, versionIndex, updatedBy) {
  const page = await getPageById(id);
  if (!page) throw new Error('Page not found');
  if (!Array.isArray(page.versions) || versionIndex < 0 || versionIndex >= page.versions.length) {
    throw new Error('Invalid version');
  }

  const target = page.versions[versionIndex];
  const nextVersions = [...page.versions, {
    title: page.title,
    content: page.content,
    updatedAt: new Date(),
    updatedBy: updatedBy || null,
  }];

  return updatePage(id, {
    title: target.title || page.title,
    content: target.content || page.content,
    versions: nextVersions,
    updatedBy: updatedBy || null,
  });
}

async function listScheduledPagesToPublish(now = new Date(), limit = 100) {
  const rows = await query(
    `SELECT * FROM pages
     WHERE scheduledAt IS NOT NULL
       AND scheduledAt <= ?
       AND status NOT IN ('approved', 'published')
     ORDER BY scheduledAt ASC
     LIMIT ?`,
    [now, Number(limit) || 100],
  );
  return rows.map(mapPage);
}

module.exports = {
  createPage,
  listPages,
  listPublicAnnouncements,
  getPageById,
  getPageBySlug,
  updatePage,
  deletePage,
  publishPage,
  unpublishPage,
  schedulePage,
  rollbackPage,
  rejectPage,
  listScheduledPagesToPublish,
};
