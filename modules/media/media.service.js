const fs = require('fs');
const path = require('path');
const { query } = require('../../config/database');
const { buildUpdate, generateId, parseDate, parseJson, toJson, withId } = require('../../utils/mysql-utils');
const { UPLOADS_ROOT } = require('../../config/uploads');
const LEGACY_UPLOADS_ROOT = path.join(__dirname, '..', '..', 'public', 'uploads');

function detectType(filename, mimetype) {
  if (mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype === 'application/pdf') return 'pdf';
    if (
      [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
      ].includes(mimetype)
    ) {
      return 'document';
    }
  }

  const ext = String(filename || '').split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(ext)) return 'document';
  return 'file';
}

function mapMedia(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    url: row.url,
    public_id: row.public_id || null,
    title: row.title || '',
    filename: row.filename || null,
    thumbnailUrl: row.thumbnailUrl || null,
    format: row.format || null,
    size: row.size == null ? null : Number(row.size),
    type: row.type || null,
    metadata: parseJson(row.metadata, {}),
    tags: parseJson(row.tags, []),
    uploadedBy: row.uploadedBy || null,
    departmentId: row.departmentId || null,
    usageRefs: parseJson(row.usageRefs, []),
    localPath: row.localPath || null,
    status: row.status || 'local',
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

function normalizeMediaUrl(url) {
  let value = String(url || '')
    .trim()
    .replace(/\\/g, '/');
  if (!value) return '';

  // Drop origin when absolute URL is stored.
  value = value.replace(/^https?:\/\/[^/]+/i, '');

  // Normalize legacy API-prefixed upload paths.
  value = value
    .replace(/^\/?api\/uploads\//i, '/uploads/')
    .replace(/^\/?uploads\//i, '/uploads/');

  return value.startsWith('/') ? value : `/${value}`;
}

function mediaUrlToLocalPath(url) {
  const normalized = normalizeMediaUrl(url);
  const match = normalized.match(/^\/uploads\/(.+)$/i);
  if (!match) return null;
  const relative = match[1]
    .split('/')
    .filter(Boolean)
    .join(path.sep);
  if (!relative) return null;
  const preferred = path.join(UPLOADS_ROOT, relative);
  const legacy = path.join(LEGACY_UPLOADS_ROOT, relative);
  if (preferred === legacy) return preferred;
  return { preferred, legacy };
}

function mediaFileToUrl(absPath, rootDir) {
  const rel = path.relative(rootDir, absPath).replace(/\\/g, '/');
  if (!rel || rel.startsWith('..')) return null;
  return `/uploads/${rel}`;
}

function deriveTitleFromFilename(filename) {
  const base = path.basename(String(filename || ''), path.extname(String(filename || '')));
  return base.replace(/[_-]+/g, ' ').trim();
}

async function walkUploadFiles(dir) {
  let entries = [];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    throw err;
  }

  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.toLowerCase() === 'tmp') continue;
      const nested = await walkUploadFiles(abs);
      files.push(...nested);
      continue;
    }
    if (entry.isFile()) {
      files.push(abs);
    }
  }
  return files;
}

function getUploadScanRoots() {
  const roots = [UPLOADS_ROOT];
  if (LEGACY_UPLOADS_ROOT !== UPLOADS_ROOT) {
    roots.push(LEGACY_UPLOADS_ROOT);
  }
  return Array.from(new Set(roots));
}

async function syncMediaFromFilesystem() {
  const existingRows = await query('SELECT _id, url FROM media');
  const knownUrls = new Set(
    existingRows
      .map((row) => normalizeMediaUrl(row.url))
      .filter(Boolean),
  );

  const roots = getUploadScanRoots();
  for (const rootDir of roots) {
    const files = await walkUploadFiles(rootDir);
    for (const absPath of files) {
      const url = mediaFileToUrl(absPath, rootDir);
      if (!url) continue;

      const normalizedUrl = normalizeMediaUrl(url);
      if (knownUrls.has(normalizedUrl)) continue;

      const alreadyExists = await query(
        'SELECT _id FROM media WHERE url = ? LIMIT 1',
        [url],
      );
      if (alreadyExists.length) {
        knownUrls.add(normalizedUrl);
        continue;
      }

      let stat = null;
      try {
        stat = await fs.promises.stat(absPath);
      } catch {
        stat = null;
      }
      if (!stat || !stat.isFile()) continue;

      const filename = path.basename(absPath);
      const format = path.extname(filename).replace('.', '').toLowerCase() || null;

      await createMedia({
        url,
        title: deriveTitleFromFilename(filename),
        filename,
        thumbnailUrl: null,
        format,
        size: stat.size,
        type: detectType(filename, null),
        tags: [],
        uploadedBy: null,
        departmentId: null,
        usageRefs: [],
        localPath: absPath,
        status: 'local',
        metadata: {
          source: 'filesystem-sync',
        },
      });

      knownUrls.add(normalizedUrl);
    }
  }
}

async function filterMediaToExistingFiles(items) {
  const checks = await Promise.all(
    items.map(async (item) => {
      const localPathCandidate = mediaUrlToLocalPath(item.url);
      const candidates = [];
      if (item.localPath) candidates.push(item.localPath);
      if (localPathCandidate && typeof localPathCandidate === 'string') {
        candidates.push(localPathCandidate);
      }
      if (localPathCandidate && typeof localPathCandidate === 'object') {
        if (localPathCandidate.preferred) candidates.push(localPathCandidate.preferred);
        if (localPathCandidate.legacy) candidates.push(localPathCandidate.legacy);
      }
      if (!candidates.length) return true;

      for (const localPath of candidates) {
        if (!localPath) continue;
        try {
          const stat = await fs.promises.stat(localPath);
          if (stat.isFile()) return true;
        } catch {
          // try next candidate
        }
      }

      try {
        const normalized = normalizeMediaUrl(item.url);
        return /^https?:\/\//i.test(String(item.url || '')) && !/^\/uploads\//i.test(normalized);
      } catch {
        return false;
      }
    }),
  );

  return items.filter((_, idx) => checks[idx]);
}

function sanitizeFolder(folder) {
  const safe = String(folder || 'media')
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.replace(/[^a-zA-Z0-9_-]/g, ''))
    .filter(Boolean)
    .join('/');
  return safe || 'media';
}

function sanitizeFileName(name) {
  const base = path.basename(String(name || 'file'));
  const dot = base.lastIndexOf('.');
  const ext = dot >= 0 ? base.slice(dot) : '';
  const stem = (dot >= 0 ? base.slice(0, dot) : base).replace(/[^a-zA-Z0-9_-]/g, '_');
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${stem || 'file'}-${unique}${ext}`;
}

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function writeUploadedFile({ file, filename, folder }) {
  const safeFolder = sanitizeFolder(folder);
  const safeFileName = sanitizeFileName(filename || file.originalname || 'file');
  const targetDir = path.join(UPLOADS_ROOT, safeFolder);
  const targetPath = path.join(targetDir, safeFileName);

  await ensureDir(targetDir);

  if (file.buffer) {
    await fs.promises.writeFile(targetPath, file.buffer);
  } else if (file.path) {
    await fs.promises.rename(file.path, targetPath);
  } else {
    throw new Error('No file content found');
  }

  const stat = await fs.promises.stat(targetPath);

  return {
    absolutePath: targetPath,
    relativeUrl: `/uploads/${safeFolder}/${safeFileName}`,
    size: stat.size,
  };
}

async function deleteLocalFile(localPath) {
  if (!localPath) return;
  try {
    await fs.promises.unlink(localPath);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      throw err;
    }
  }
}

async function createMedia(payload) {
  const now = new Date();
  const _id = generateId();

  await query(
    `INSERT INTO media
      (_id, url, public_id, title, filename, thumbnailUrl, format, size, type, metadata, tags,
       uploadedBy, departmentId, usageRefs, localPath, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      payload.url,
      payload.public_id || null,
      payload.title || '',
      payload.filename || null,
      payload.thumbnailUrl || null,
      payload.format || null,
      payload.size == null ? null : Number(payload.size),
      payload.type || null,
      toJson(payload.metadata || {}),
      toJson(payload.tags || []),
      payload.uploadedBy || null,
      payload.departmentId || null,
      toJson(payload.usageRefs || []),
      payload.localPath || null,
      payload.status || 'local',
      now,
      now,
    ],
  );

  return getMediaById(_id);
}

async function createMediaFromUpload({ file, filename, title, uploadedBy, departmentId, tags = [], folder }) {
  if (!file) {
    throw new Error('No file data received');
  }

  const stored = await writeUploadedFile({
    file,
    filename: filename || file.originalname,
    folder: folder || 'media',
  });

  const type = detectType(filename || file.originalname, file.mimetype);

  return createMedia({
    url: stored.relativeUrl,
    public_id: null,
    title: title || '',
    filename: path.basename(stored.absolutePath),
    thumbnailUrl: null,
    format: path.extname(stored.absolutePath).replace('.', '').toLowerCase() || null,
    size: stored.size,
    type,
    tags,
    uploadedBy,
    departmentId,
    localPath: stored.absolutePath,
    status: 'local',
    metadata: {
      mimetype: file.mimetype || null,
      originalName: filename || file.originalname || null,
    },
  });
}

async function listCloudMedia() {
  await syncMediaFromFilesystem();

  const rows = await query(
    `SELECT * FROM media
     ORDER BY createdAt DESC`,
  );
  const mapped = rows.map(mapMedia);
  return filterMediaToExistingFiles(mapped);
}

async function getMediaById(id) {
  const rows = await query('SELECT * FROM media WHERE _id = ? LIMIT 1', [id]);
  return mapMedia(rows[0]);
}

async function updateMediaById(id, payload) {
  const source = { ...payload, updatedAt: new Date() };
  const transforms = {
    metadata: (v) => toJson(v || {}),
    tags: (v) => toJson(v || []),
    usageRefs: (v) => toJson(v || []),
  };

  const { set, values } = buildUpdate(
    source,
    [
      'url',
      'public_id',
      'title',
      'filename',
      'thumbnailUrl',
      'format',
      'size',
      'type',
      'metadata',
      'tags',
      'uploadedBy',
      'departmentId',
      'usageRefs',
      'localPath',
      'status',
      'updatedAt',
    ],
    transforms,
  );

  if (set.length) {
    await query(`UPDATE media SET ${set.join(', ')} WHERE _id = ?`, [...values, id]);
  }

  return getMediaById(id);
}

async function deleteMediaById(id) {
  const doc = await getMediaById(id);
  if (!doc) return null;

  await query('DELETE FROM media WHERE _id = ?', [id]);
  await deleteLocalFile(doc.localPath);

  return doc;
}

module.exports = {
  createMediaFromUpload,
  deleteMediaById,
  getMediaById,
  listCloudMedia,
  updateMediaById,
};
