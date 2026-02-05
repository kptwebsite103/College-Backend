const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const audit = require('../../middlewares/audit.middleware');
const controller = require('./department.controller');
const cacheMiddleware = require('../../middlewares/cache.middleware');

router.get('/', cacheMiddleware({
  ttl: 600, // 10 minutes for department list
  keyPrefix: 'departments:'
}), controller.list);
router.post('/', auth, requireRole('admin'), audit({ resourceType: 'department' }), controller.create);
router.get('/:id', controller.getById);
router.get('/slug/:slug', controller.getBySlug);
router.get('/:id/faculty', controller.getFaculty);
router.put('/:id', auth, requireRole('admin'), audit({ resourceType: 'department' }), controller.update);
router.delete('/:id', auth, requireRole('superadmin'), audit({ resourceType: 'department' }), controller.remove);

module.exports = router;
