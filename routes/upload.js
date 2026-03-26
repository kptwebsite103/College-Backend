const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();
const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadsRoot, { recursive: true });

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

function saveFile(file, folder) {
  const safeFolder = sanitizeFolder(folder);
  const dir = path.join(uploadsRoot, safeFolder);
  fs.mkdirSync(dir, { recursive: true });

  const filename = sanitizeFileName(file.originalname || 'file');
  const targetPath = path.join(dir, filename);
  fs.renameSync(file.path, targetPath);

  return {
    success: true,
    data: {
      fileId: filename,
      filePath: targetPath,
      fileName: filename,
      folder: safeFolder,
      url: `/uploads/${safeFolder}/${filename}`,
      bytes: fs.statSync(targetPath).size,
      format: path.extname(filename).replace('.', '').toLowerCase() || null,
    },
  };
}

const tmpDir = path.join(uploadsRoot, 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${sanitizeFileName(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/x-m4a', 'audio/aac', 'audio/ogg',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv'
  ];

  if (
    allowedTypes.includes(file.mimetype) ||
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype.startsWith('audio/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, audio, and documents are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  }
});

router.post('/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const folder = req.body.folder || 'media';
    const result = saveFile(req.file, folder);
    res.status(200).json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

router.post('/multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const folder = req.body.folder || 'media';
    const successful = req.files.map((file) => saveFile(file, folder));

    res.status(200).json({
      success: true,
      message: `Uploaded ${successful.length} out of ${req.files.length} files successfully`,
      data: {
        successful,
        failed: [],
      }
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const folder = sanitizeFolder(req.query.folder || 'media');
    const target = path.join(uploadsRoot, folder, path.basename(fileId));

    if (fs.existsSync(target)) fs.unlinkSync(target);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete failed',
      error: error.message
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const folder = sanitizeFolder(req.query.folder || 'media');
    const dir = path.join(uploadsRoot, folder);
    const files = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((name) => fs.statSync(path.join(dir, name)).isFile())
      : [];

    res.status(200).json({
      success: true,
      data: files.map((name) => ({
        fileId: name,
        fileName: name,
        folder,
        url: `/uploads/${folder}/${name}`,
      })),
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list files',
      error: error.message
    });
  }
});

router.get('/auth-params', async (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Auth params endpoint is disabled in local-file storage mode',
  });
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.'
      });
    }
  }

  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Upload failed',
    error: error.message
  });
});

module.exports = router;
