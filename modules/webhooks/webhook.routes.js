const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const controller = require('./webhook.controller');

// Public webhook endpoint for external services
router.post('/', controller.receiveWebhook);

// Protected routes for managing webhooks
router.get('/', auth, requireRole('admin'), controller.listWebhooks);
router.get('/:id', auth, requireRole('admin'), controller.getWebhook);

module.exports = router;