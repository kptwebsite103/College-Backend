const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const audit = require('../../middlewares/audit.middleware');
const controller = require('./menu.controller.custom');

// Helper function to check if user has admin or super-admin role
const requireAdminRole = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles].filter(Boolean);
  const hasAdminRole = userRoles.some(role => 
    ['admin', 'super-admin'].includes(String(role).toLowerCase())
  );
  
  if (!hasAdminRole) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};

router.get('/', controller.list);
router.post('/', auth, requireAdminRole, audit({ resourceType: 'menu' }), controller.create);
router.get('/:id', controller.getById);
router.put('/:id', auth, requireAdminRole, audit({ resourceType: 'menu' }), controller.update);
router.delete('/:id', auth, requireAdminRole, audit({ resourceType: 'menu' }), controller.remove);

module.exports = router;
