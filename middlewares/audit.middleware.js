const { createActivity } = require('../modules/activity-log/activity.service');

function auditMiddleware(options = {}) {
  return async (req, res, next) => {
    // Store original send method
    const originalSend = res.send;
    let responseBody;

    // Override send to capture response
    res.send = function (body) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    // After response is sent, log the activity
    res.on('finish', async () => {
      try {
        if (!req.user) return; // Only log if user is authenticated

        const resourceType = options.resourceType || req.baseUrl.split('/').pop() || 'unknown';
        let action = options.action || 'unknown';
        let resourceId = req.params.id || req.params[resourceType + 'Id'] || null;

        // If no custom action, determine based on method and path
        if (action === 'unknown') {
          const pathParts = req.path.split('/').filter(p => p);
          const lastPart = pathParts[pathParts.length - 1];

          switch (req.method.toUpperCase()) {
            case 'POST':
              if (lastPart === resourceType + 's' || lastPart === resourceType) {
                action = 'create';
                // For create, resourceId might be in response if it's returned
                if (responseBody && typeof responseBody === 'string') {
                  try {
                    const parsed = JSON.parse(responseBody);
                    if (parsed && parsed._id) resourceId = parsed._id;
                  } catch (e) {}
                }
              } else {
                action = lastPart; // e.g., publish, unpublish
              }
              break;
            case 'PUT':
            case 'PATCH':
              action = 'update';
              break;
            case 'DELETE':
              action = 'delete';
              break;
            default:
              return; // Don't log other methods
          }
        }

        const entry = {
          actorId: req.user.id,
          actorEmail: req.user.email,
          action,
          resourceType,
          resourceId,
          meta: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
          },
        };

        // For updates, try to capture before/after if available
        if (action === 'update' && options.before && options.after) {
          entry.before = options.before;
          entry.after = options.after;
        }

        await createActivity(entry);
      } catch (err) {
        console.error('Audit logging error:', err);
      }
    });

    next();
  };
}

module.exports = auditMiddleware;