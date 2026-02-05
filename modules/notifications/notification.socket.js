let ioInstance = null;

function init(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('User connected for notifications:', socket.id);

    // Authenticate user and join notification room
    socket.on('authenticate', async (data) => {
      const { userId, token } = data;
      try {
        // Validate token if provided
        if (token) {
          const jwt = require('jsonwebtoken');
          const secret = process.env.JWT_SECRET || 'your-secret-key';
          const decoded = jwt.verify(token, secret);
          if (decoded.id !== userId) {
            socket.emit('auth_error', { message: 'Invalid token for user' });
            return;
          }
        }

        if (userId) {
          socket.join(`user_${userId}`);
          socket.userId = userId;
          socket.emit('authenticated', { userId });
          console.log(`User ${userId} authenticated and joined notification room`);
        } else {
          socket.emit('auth_error', { message: 'User ID required' });
        }
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('auth_error', { message: 'Authentication failed' });
      }
    });

    // Leave notification room
    socket.on('leave_notifications', () => {
      if (socket.userId) {
        socket.leave(`user_${socket.userId}`);
        console.log(`User ${socket.userId} left notification room`);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from notifications:', socket.id);
    });
  });
}

function emitNotification(userId, notification) {
  if (!ioInstance) {
    console.warn('Socket.io not initialized');
    return;
  }
  ioInstance.to(`user_${userId}`).emit('notification', notification);
}

module.exports = { init, emitNotification };