const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const controller = require('./workflow.controller');

// Workflow definition routes
router.get('/', auth, requireRole('admin'), controller.list);
router.post('/', auth, requireRole('admin'), controller.create);
router.get('/:id', auth, requireRole('admin'), controller.getById);
router.put('/:id', auth, requireRole('admin'), controller.update);
router.delete('/:id', auth, requireRole('superadmin'), controller.remove);
router.post('/:id/execute', auth, requireRole('admin'), controller.execute);

// Workflow instance routes
router.post('/instances', auth, controller.createInstance);
router.get('/instances', auth, controller.listInstances);
router.get('/instances/:id', auth, controller.getInstanceById);
router.post('/instances/:id/approve', auth, controller.approveInstance);
router.post('/instances/:id/reject', auth, controller.rejectInstance);
router.get('/my-pending-approvals', auth, controller.getMyPendingApprovals);

module.exports = router;