const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// ----------------------------
// CORS configuration
// ----------------------------
function normalizeOrigin(origin) {
  return String(origin || '').trim().replace(/\/+$/, '');
}

function isTrustedVercelOrigin(origin) {
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://kpt-mangalore-autonomous.vercel.app',
      'https://kpt-website-psi.vercel.app',
      'http://localhost:5174',
      'http://localhost:5175',
    ];

const allowedOrigins = configuredOrigins
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const requestOrigin = normalizeOrigin(origin);
    const isAllowed =
      allowedOrigins.includes(requestOrigin) ||
      isTrustedVercelOrigin(requestOrigin);
    if (!isAllowed) {
      console.warn(
        `[CORS] Blocked origin: ${requestOrigin}. Allowed: ${allowedOrigins.join(', ')}`,
      );
    }
    return callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ----------------------------
// Body parsers
// ----------------------------
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: false }));

// ----------------------------
// Static files
// ----------------------------
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ----------------------------
// Express settings
// ----------------------------
app.set('trust proxy', true);

// ----------------------------
// Analytics middleware (optional)
// ----------------------------
try {
  const { trackPageView, trackUserActivity } = require('./middlewares/analytics.middleware');
  app.use(trackPageView);
  app.use(trackUserActivity);
} catch (err) {
  console.warn('Analytics middleware not loaded:', err && err.message ? err.message : err);
}

// ----------------------------
// Health check & basic routes
// ----------------------------
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.json({ status: 'ok' }));

// ----------------------------
// Favicon handler
// ----------------------------
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ----------------------------
// Helper: safely mount feature routes
// ----------------------------
function safeMount(routePath, modulePath) {
  try {
    const r = require(modulePath);
    if (r && typeof r === 'function') app.use(routePath, r);
  } catch (err) {
    console.warn(`Route not mounted (${routePath}): ${modulePath} — ${err && err.message ? err.message : err}`);
  }
}

// ----------------------------
// API routes
// ----------------------------
safeMount('/api/pages', './modules/pages/page.routes');
safeMount('/api', './routes/me.routes');

try {
  const authRoutes = require('./modules/auth/auth.routes');
  app.use('/api/auth', authRoutes);
} catch (err) {
  console.warn('Auth routes not mounted:', err && err.message ? err.message : err);
}

safeMount('/api/activity', './modules/activity-log/activity.routes');
safeMount('/api/media', './modules/media/media.routes');
safeMount('/api/upload', './routes/upload');
safeMount('/api/departments', './modules/departments/department.routes');
safeMount('/api/menus', './modules/menu/menu.routes');
safeMount('/api/themes', './modules/theme/theme.routes');
safeMount('/api/home-sections', './modules/home-sections/homeSection.routes');
safeMount('/api/users', './modules/users/user.routes');
safeMount('/api/workflows', './modules/workflows/workflow.routes');
safeMount('/api/notifications', './modules/notifications/notification.routes');
safeMount('/api/analytics', './modules/analytics/analytics.routes');
safeMount('/api/webhooks', './modules/webhooks/webhook.routes');

// ----------------------------
// Swagger/OpenAPI docs (optional)
// ----------------------------
try {
  const swaggerUi = require('swagger-ui-express');
  const YAML = require('yamljs');
  const openapi = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
} catch (err) {
  console.warn('Swagger UI not mounted:', err && err.message ? err.message : err);
}

// ----------------------------
// 404 handler
// ----------------------------
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));

// ----------------------------
// Error handler (must be last)
// ----------------------------
try {
  const errorHandler = require('./middlewares/error.middleware');
  app.use(errorHandler);
} catch (err) {
  console.warn('Error middleware not loaded:', err && err.message ? err.message : err);
}

// ----------------------------
// Export app for serverless (Vercel) or local dev
// ----------------------------
module.exports = app;
