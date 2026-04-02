const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const controller = require('./theme.controller');

// Helper function to check if user has admin or super-admin role
const requireAdminRole = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles].filter(Boolean);
  const hasAdminRole = userRoles.some((role) => {
    const normalized = String(role || '')
      .toLowerCase()
      .trim()
      .replace(/_/g, '-');
    return ['admin', 'administrator', 'super-admin', 'superadmin'].includes(normalized);
  });

  if (!hasAdminRole) {
    return res.status(403).json({ message: 'Admin role required' });
  }

  next();
};

// Routes
router.get('/', auth, controller.list);
router.get('/:type', controller.get);
router.post('/', auth, requireAdminRole, controller.create);
router.put('/:type', auth, requireAdminRole, controller.update);

module.exports = router;
