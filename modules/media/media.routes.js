const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const upload = require('./media.upload');
const controller = require('./media.controller');

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 50MB limit' });
    }

    const status = err.status || 400;
    return res.status(status).json({ message: err.message || 'Invalid upload request' });
  });
}

// List media (authenticated users)
router.get('/', auth, controller.list);

// Signed upload (client direct upload) - only editors/admins
router.post('/sign', auth, requireRole('admin', 'editor'), controller.sign);

// Upload route (authenticated users with proper role)
router.post('/', auth, requireRole('admin', 'editor'), handleUpload, controller.upload);
router.post('/upload', auth, requireRole('admin', 'editor'), handleUpload, controller.upload);

// Update metadata (title, tags, department)
router.put('/:id', auth, requireRole('admin', 'editor'), controller.update);

// Delete media
router.delete('/:id', auth, requireRole('admin', 'editor'), controller.remove);

module.exports = router;
