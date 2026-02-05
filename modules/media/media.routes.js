const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const upload = require('./media.upload');
const controller = require('./media.controller');

// List media (authenticated users)
router.get('/', auth, controller.list);

// Signed upload (client direct upload) - only editors/admins
router.post('/sign', auth, requireRole('admin', 'editor'), controller.sign);

// Upload route (authenticated users with proper role)
router.post('/upload', auth, requireRole('admin', 'editor'), upload.single('file'), controller.upload);

module.exports = router;
