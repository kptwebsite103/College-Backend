const { createAnalytics } = require('../modules/analytics/analytics.service');
const { emitAnalyticsUpdate } = require('../sockets/analytics.socket');

async function trackPageView(req, res, next) {
  // Track page views for GET requests, excluding static files and API routes
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.includes('.')) {
    try {
      const analyticsData = await createAnalytics({
        event: 'page_view',
        data: {
          path: req.path,
          query: req.query,
          referrer: req.get('Referrer'),
        },
        userId: req.user ? req.user.id : null,
        sessionId: req.sessionID || null,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      // Emit real-time analytics update
      emitAnalyticsUpdate('page_view', analyticsData);
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }
  next();
}

async function trackUserActivity(req, res, next) {
  // Track user activities for authenticated requests
  if (req.user) {
    try {
      const analyticsData = await createAnalytics({
        event: 'user_activity',
        data: {
          method: req.method,
          path: req.path,
          action: `${req.method} ${req.path}`,
        },
        userId: req.user.id,
        sessionId: req.sessionID || null,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      // Emit real-time analytics update
      emitAnalyticsUpdate('user_activity', analyticsData);
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }
  next();
}

module.exports = { trackPageView, trackUserActivity };