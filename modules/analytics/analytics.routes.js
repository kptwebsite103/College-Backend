const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const controller = require('./analytics.controller');

router.post('/', controller.create);
router.get('/', auth, requireRole('admin'), controller.list);
router.get('/:id', auth, requireRole('admin'), controller.getById);
router.get('/reports/page-views', auth, requireRole('admin'), controller.getPageViews);
router.get('/reports/user-activity', auth, requireRole('admin'), controller.getUserActivity);
router.get('/reports/general', auth, requireRole('admin'), controller.getGeneral);

module.exports = router;