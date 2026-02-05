let ioInstance = null;

function init(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('User connected for analytics:', socket.id);

    // Authenticate user for analytics
    socket.on('authenticate_analytics', async (data) => {
      const { userId, token, subscriptions = [] } = data;
      try {
        // Validate token if provided
        if (token) {
          const jwt = require('jsonwebtoken');
          const secret = process.env.JWT_SECRET || 'your-secret-key';
          const decoded = jwt.verify(token, secret);
          if (decoded.id !== userId) {
            socket.emit('analytics_auth_error', { message: 'Invalid token for user' });
            return;
          }
        }

        if (userId) {
          socket.join(`analytics_user_${userId}`);
          socket.userId = userId;
          socket.analyticsSubscriptions = subscriptions; // e.g., ['page_views', 'user_activity']

          // Join specific subscription rooms
          subscriptions.forEach(sub => {
            socket.join(`analytics_${sub}`);
          });

          socket.emit('analytics_authenticated', { userId, subscriptions });
          console.log(`User ${userId} authenticated for analytics with subscriptions: ${subscriptions.join(', ')}`);
        } else {
          socket.emit('analytics_auth_error', { message: 'User ID required' });
        }
      } catch (error) {
        console.error('Analytics authentication error:', error);
        socket.emit('analytics_auth_error', { message: 'Authentication failed' });
      }
    });

    // Subscribe to specific analytics events
    socket.on('subscribe_analytics', (events) => {
      if (!socket.userId) {
        socket.emit('analytics_error', { message: 'Not authenticated' });
        return;
      }
      events.forEach(event => {
        socket.join(`analytics_${event}`);
      });
      socket.analyticsSubscriptions = [...(socket.analyticsSubscriptions || []), ...events];
      socket.emit('analytics_subscribed', { events });
      console.log(`User ${socket.userId} subscribed to analytics events: ${events.join(', ')}`);
    });

    // Unsubscribe from analytics events
    socket.on('unsubscribe_analytics', (events) => {
      events.forEach(event => {
        socket.leave(`analytics_${event}`);
      });
      socket.analyticsSubscriptions = (socket.analyticsSubscriptions || []).filter(sub => !events.includes(sub));
      socket.emit('analytics_unsubscribed', { events });
      console.log(`User ${socket.userId} unsubscribed from analytics events: ${events.join(', ')}`);
    });

    // Leave analytics rooms
    socket.on('leave_analytics', () => {
      if (socket.userId) {
        socket.leave(`analytics_user_${socket.userId}`);
        (socket.analyticsSubscriptions || []).forEach(sub => {
          socket.leave(`analytics_${sub}`);
        });
        console.log(`User ${socket.userId} left analytics rooms`);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from analytics:', socket.id);
    });
  });
}

function emitAnalyticsUpdate(event, data) {
  if (!ioInstance) {
    console.warn('Socket.io not initialized for analytics');
    return;
  }
  // Emit to all clients subscribed to this event
  ioInstance.to(`analytics_${event}`).emit('analytics_update', { event, data, timestamp: new Date() });
  // Also emit to general analytics room
  ioInstance.to('analytics_general').emit('analytics_update', { event, data, timestamp: new Date() });
}

function emitAnalyticsToUser(userId, event, data) {
  if (!ioInstance) {
    console.warn('Socket.io not initialized for analytics');
    return;
  }
  ioInstance.to(`analytics_user_${userId}`).emit('analytics_update', { event, data, timestamp: new Date() });
}

module.exports = { init, emitAnalyticsUpdate, emitAnalyticsToUser };