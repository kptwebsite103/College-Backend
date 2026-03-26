const fs = require('fs');
const path = require('path');
const { query } = require('../../config/database');
const { buildUpdate, generateId, parseDate, parseJson, toJson, withId } = require('../../utils/mysql-utils');
const { UPLOADS_ROOT } = require('../../config/uploads');

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
  const rows = await query(
    `SELECT * FROM media
     ORDER BY createdAt DESC`,
  );
  return rows.map(mapMedia);
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
