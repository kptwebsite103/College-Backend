let ioInstance = null;

function init(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('Real-time client connected:', socket.id);

    // Handle authentication for all services
    socket.on('authenticate', async (data) => {
      const { userId, token, services = [] } = data; // services: ['notifications', 'analytics', 'pages']
      try {
        // Validate token
        if (token) {
          const jwt = require('jsonwebtoken');
          const secret = process.env.JWT_SECRET || 'your-secret-key';
          const decoded = jwt.verify(token, secret);
          if (decoded.id !== userId) {
            socket.emit('auth_error', { message: 'Invalid token' });
            return;
          }
        }

        if (userId) {
          socket.userId = userId;
          socket.authenticatedServices = services;

          // Join user-specific rooms for each service
          services.forEach(service => {
            socket.join(`${service}_user_${userId}`);
          });

          socket.emit('authenticated', { userId, services });
          console.log(`User ${userId} authenticated for services: ${services.join(', ')}`);
        } else {
          socket.emit('auth_error', { message: 'User ID required' });
        }
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('auth_error', { message: 'Authentication failed' });
      }
    });

    // Service-specific subscriptions
    socket.on('subscribe', (data) => {
      const { service, channels = [] } = data;
      if (!socket.userId) {
        socket.emit('subscription_error', { message: 'Not authenticated' });
        return;
      }

      channels.forEach(channel => {
        socket.join(`${service}_${channel}`);
      });

      socket.emit('subscribed', { service, channels });
      console.log(`User ${socket.userId} subscribed to ${service} channels: ${channels.join(', ')}`);
    });

    socket.on('unsubscribe', (data) => {
      const { service, channels = [] } = data;
      channels.forEach(channel => {
        socket.leave(`${service}_${channel}`);
      });
      socket.emit('unsubscribed', { service, channels });
      console.log(`User ${socket.userId} unsubscribed from ${service} channels: ${channels.join(', ')}`);
    });

    // Ping-pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    socket.on('disconnect', () => {
      console.log('Real-time client disconnected:', socket.id);
    });
  });
}

// Helper functions for emitting to specific services
function emitToService(service, event, data, room = null) {
  if (!ioInstance) {
    console.warn('Socket.io not initialized');
    return;
  }

  const target = room ? ioInstance.to(`${service}_${room}`) : ioInstance.to(service);
  target.emit(event, { ...data, timestamp: new Date() });
}

function emitNotification(userId, notification) {
  emitToService('notifications', 'notification', notification, `user_${userId}`);
}

function emitAnalyticsUpdate(event, data) {
  emitToService('analytics', 'analytics_update', { event, data });
}

function emitPageUpdate(pageId, action, data) {
  emitToService('pages', 'page_update', { pageId, action, data });
}

module.exports = { init, emitNotification, emitAnalyticsUpdate, emitPageUpdate };