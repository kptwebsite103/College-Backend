const express = require('express');
const router = express.Router();
const controller = require('./page.controller.simple');

// Real database routes with simplified controller
router.get('/', controller.list);
router.get('/slug/:slug', controller.getBySlug);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/:id/publish', controller.publish);
router.delete('/:id', controller.remove);

module.exports = router;
