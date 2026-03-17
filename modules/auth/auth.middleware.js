const jwt = require('jsonwebtoken');
const { getUser } = require('../users/user.service');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

module.exports = async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid Authorization format' });

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user._id || user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles || [],
      raw: user,
    };

    return next();
  } catch (err) {
    console.error('Auth verification error:', err && err.message ? err.message : err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
