const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const controller = require('./activity.controller');

// Admin-only listing of activity logs
router.get('/', auth, requireRole('admin'), controller.list);

module.exports = router;