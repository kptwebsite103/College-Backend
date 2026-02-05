const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const controller = require('./notification.controller');

router.get('/', auth, controller.list);
router.get('/:id', auth, controller.getById);
router.put('/:id/read', auth, controller.markRead);

module.exports = router;