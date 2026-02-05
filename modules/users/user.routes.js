const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const audit = require('../../middlewares/audit.middleware');
const controller = require('./user.controller');

router.get('/', auth, requireRole(['admin', 'creator']), controller.list);
router.get('/count', controller.getUserCount);
router.post('/', auth, requireRole(['admin', 'creator']), audit({ resourceType: 'user' }), controller.create);
router.get('/:id', auth, requireRole(['admin', 'creator']), controller.getById);
router.put('/:id', auth, requireRole(['admin', 'superadmin']), audit({ resourceType: 'user' }), controller.update);
router.delete('/:id', auth, requireRole(['admin', 'superadmin']), audit({ resourceType: 'user' }), controller.remove);

module.exports = router;