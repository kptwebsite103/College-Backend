const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const controller = require('./auth.controller');
const rateLimitMiddleware = require('../../middlewares/rateLimit.middleware');

// Auth routes (JWT-based) with rate limiting
router.post('/register', rateLimitMiddleware({ max: 5, windowMs: 15 * 60 * 1000 }), controller.registerUser);
router.post('/login', rateLimitMiddleware({ max: 10, windowMs: 15 * 60 * 1000 }), controller.loginUser);
router.post('/refresh', rateLimitMiddleware({ max: 20, windowMs: 15 * 60 * 1000 }), controller.refreshUserToken);
router.post('/logout', auth, controller.logoutUser);
router.post('/forgot-password', rateLimitMiddleware({ max: 3, windowMs: 60 * 60 * 1000 }), controller.forgotUserPassword);
router.post('/reset-password', rateLimitMiddleware({ max: 5, windowMs: 15 * 60 * 1000 }), controller.resetUserPassword);

module.exports = router;