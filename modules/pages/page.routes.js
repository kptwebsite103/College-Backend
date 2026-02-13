const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const controller = require('./page.controller.simple');

// Real database routes with simplified controller
router.get('/public/announcements', controller.listAnnouncements);
router.get('/', auth, controller.list);
router.get('/slug/:slug', controller.getBySlug);
router.get('/:id', auth, controller.get);
router.post('/', auth, controller.create);
router.put('/:id', auth, controller.update);
router.post('/:id/publish', auth, controller.publish);
router.post('/:id/approve', auth, controller.publish);
router.post('/:id/reject', auth, controller.reject);
router.delete('/:id', auth, controller.remove);

module.exports = router;
