module.exports = function requireRole(requiredRole) {
  if (!requiredRole) throw new Error('requireRole requires a role string');
  const normalized = String(requiredRole).toLowerCase();

  return function (req, res, next) {
    // not authenticated
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const rawRoles = req.user.roles || [];
    const roles = Array.isArray(rawRoles) ? rawRoles.map(r => String(r).toLowerCase()) : [String(rawRoles).toLowerCase()];
    
    // Super-admin has access to all routes
    if (roles.includes('super-admin')) return next();
    
    // Check if user has admin, super-admin, or creator role (handle both array and string)
    const hasAdminRole = roles.includes('admin') || roles.includes('super-admin') || roles.includes('creator');
    
    if (!hasAdminRole) return res.status(403).json({ message: 'Forbidden' });
    
    return next();
  };
};
