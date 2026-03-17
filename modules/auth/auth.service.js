const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {
  createUser,
  findUserByUsername,
  findUserByUsernameEmail,
  findUserByUsernameOrEmail,
  getUser,
  updateUser,
} = require('../users/user.service');
const redisService = require('../../services/redis.service');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev_jwt_refresh_secret_change_me';

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set. Using development default secret. Set JWT_SECRET in env for production.');
}

// JWT Auth functions
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

async function register(userData) {
  const { username, email, password, firstName, lastName, roles = ['user'] } = userData;
  const normalizedEmail = email || username;

  // Check if user exists
  const existingUser = await findUserByUsernameOrEmail(username, normalizedEmail);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const user = await createUser({
    username,
    email: normalizedEmail,
    password,
    firstName,
    lastName,
    roles,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles
    },
    accessToken,
    refreshToken
  };
}

async function login(credentials) {
  if (!credentials || typeof credentials !== 'object') {
    throw new Error('Missing credentials');
  }
  const { username, email, password } = credentials;
  const normalizedEmail = email || username;

  // Find user by both username AND email (exact match)
  const user = await findUserByUsernameEmail(username, normalizedEmail, { includePassword: true });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isValidPassword = await comparePassword(password, user.password || '');
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles
    },
    accessToken,
    refreshToken
  };
}

async function refreshToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await getUser(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

async function logout() {
  // In a real implementation, you might want to blacklist tokens
  // For now, just return success
  return { message: 'Logged out successfully' };
}

async function forgotPassword(username) {
  const user = await findUserByUsername(username);
  if (!user) {
    return { message: 'If the username exists, a reset code has been sent' };
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  await redisService.storeOTP(username, otp, 600);
  console.log(`OTP for ${username}: ${otp}`);
  return { message: 'If the username exists, a reset code has been sent' };
}

async function resetPassword(username, otp, newPassword) {
  const storedOtp = await redisService.getOTP(username);
  if (!storedOtp || storedOtp !== otp) {
    throw new Error('Invalid or expired OTP');
  }

  const user = await findUserByUsername(username, { includePassword: true });
  if (!user) {
    throw new Error('User not found');
  }

  await updateUser(user._id, { password: newPassword });
  return { message: 'Password reset successfully' };
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword
};
