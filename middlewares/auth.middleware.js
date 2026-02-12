const jwt = require('jsonwebtoken');
const User = require('../modules/users/user.model');

module.exports = async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid Authorization format' });

  const token = parts[1];

  // Development bypass for testing
  if (process.env.NODE_ENV === 'development' && token === 'dev-mock-jwt-token-for-development') {
    req.user = {
      id: '000000000000000000000001',
      username: 'dev-admin',
      firstName: 'Development',
      lastName: 'Admin',
      roles: ['admin', 'super-admin'],
      raw: null,
    };
    return next();
  }

  try {
    const localSecret = process.env.JWT_SECRET;
    if (!localSecret) return res.status(401).json({ message: 'JWT secret not configured' });

    const decodedLocal = jwt.verify(token, localSecret);
    if (!decodedLocal || !decodedLocal.userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const dbUser = await User.findById(decodedLocal.userId);
    if (!dbUser) return res.status(401).json({ message: 'Invalid or expired token' });

    req.user = {
      id: String(dbUser._id),
      username: dbUser.username,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      roles: dbUser.roles || decodedLocal.roles || [],
      raw: dbUser,
    };

    return next();
  } catch (err) {
    console.error('Auth verification error:', err && err.message ? err.message : err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
