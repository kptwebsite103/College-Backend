const {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword
} = require('./auth.service');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('./auth.validation');


async function registerUser(req, res) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const result = await register(value);
    res.status(201).json(result);
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ message: err.message });
  }
}

async function loginUser(req, res) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const result = await login(value);
    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    res.status(401).json({ message: err.message });
  }
}

async function refreshUserToken(req, res) {
  try {
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const result = await refreshToken(value.refreshToken);
    res.json(result);
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(401).json({ message: err.message });
  }
}

async function logoutUser(req, res) {
  try {
    const result = await logout();
    res.json(result);
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Logout failed' });
  }
}

async function forgotUserPassword(req, res) {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const result = await forgotPassword(value.username);
    res.json(result);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to process request' });
  }
}

async function resetUserPassword(req, res) {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const result = await resetPassword(value.username, value.otp, value.password);
    res.json(result);
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(400).json({ message: err.message });
  }
}

module.exports = {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  forgotUserPassword,
  resetUserPassword
};