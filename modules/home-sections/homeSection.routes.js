const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const audit = require('../../middlewares/audit.middleware');
const controller = require('./homeSection.controller');
const cacheMiddleware = require('../../middlewares/cache.middleware');

router.get('/active', cacheMiddleware({
  ttl: 600, // 10 minutes for homepage content
  keyPrefix: 'homepage:'
}), controller.listActive);
router.get('/', controller.list);
router.post('/', auth, requireRole('admin'), audit({ resourceType: 'homeSection' }), controller.create);
router.get('/:id', controller.getById);
router.put('/:id', auth, requireRole('admin'), audit({ resourceType: 'homeSection' }), controller.update);
router.delete('/:id', auth, requireRole('superadmin'), audit({ resourceType: 'homeSection' }), controller.remove);

module.exports = router;