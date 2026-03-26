const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { UPLOADS_ROOT } = require('../../config/uploads');

// Store uploads temporarily on disk, then service moves them to final folder.
const tmpDir = path.join(UPLOADS_ROOT, 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const safeName = String(file.originalname || 'file')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const allowedTypes = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/webm',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/flac',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];

const fileFilter = (req, file, cb) => {
  if (
    allowedTypes.includes(file.mimetype) ||
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype.startsWith('audio/')
  ) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only images, videos, audio, and documents are allowed.');
    error.status = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

module.exports = upload;
