const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const controller = require('./backup.controller');

router.get('/', auth, requireRole('admin'), controller.list);
router.post('/', auth, requireRole('admin'), controller.create);
router.get('/:id', auth, requireRole('admin'), controller.getById);

module.exports = router;