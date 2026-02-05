module.exports = function requirePermission(requiredPermission) {
  if (!requiredPermission) throw new Error('requirePermission requires a permission string');
  const normalized = String(requiredPermission).toLowerCase();

  return function (req, res, next) {
    // not authenticated
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const rawPermissions = req.user.permissions || [];
    const permissions = Array.isArray(rawPermissions) ? rawPermissions.map(p => String(p).toLowerCase()) : [String(rawPermissions).toLowerCase()];

    if (!permissions.includes(normalized)) return res.status(403).json({ message: 'Forbidden' });

    return next();
  };
};