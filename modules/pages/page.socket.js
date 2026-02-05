let ioInstance = null;

function init(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('User connected for pages:', socket.id);

    // Authenticate user for page updates
    socket.on('authenticate_pages', async (data) => {
      const { userId, token, pageIds = [] } = data;
      try {
        // Validate token if provided
        if (token) {
          const jwt = require('jsonwebtoken');
          const secret = process.env.JWT_SECRET || 'your-secret-key';
          const decoded = jwt.verify(token, secret);
          if (decoded.id !== userId) {
            socket.emit('pages_auth_error', { message: 'Invalid token for user' });
            return;
          }
        }

        if (userId) {
          socket.join(`pages_user_${userId}`);
          socket.userId = userId;
          socket.subscribedPages = pageIds;

          // Join specific page rooms
          pageIds.forEach(pageId => {
            socket.join(`page_${pageId}`);
          });

          socket.emit('pages_authenticated', { userId, pageIds });
          console.log(`User ${userId} authenticated for pages with subscriptions: ${pageIds.join(', ')}`);
        } else {
          socket.emit('pages_auth_error', { message: 'User ID required' });
        }
      } catch (error) {
        console.error('Pages authentication error:', error);
        socket.emit('pages_auth_error', { message: 'Authentication failed' });
      }
    });

    // Subscribe to specific page updates
    socket.on('subscribe_page', (pageIds) => {
      if (!socket.userId) {
        socket.emit('pages_error', { message: 'Not authenticated' });
        return;
      }
      pageIds.forEach(pageId => {
        socket.join(`page_${pageId}`);
      });
      socket.subscribedPages = [...(socket.subscribedPages || []), ...pageIds];
      socket.emit('page_subscribed', { pageIds });
      console.log(`User ${socket.userId} subscribed to pages: ${pageIds.join(', ')}`);
    });

    // Unsubscribe from page updates
    socket.on('unsubscribe_page', (pageIds) => {
      pageIds.forEach(pageId => {
        socket.leave(`page_${pageId}`);
      });
      socket.subscribedPages = (socket.subscribedPages || []).filter(id => !pageIds.includes(id));
      socket.emit('page_unsubscribed', { pageIds });
      console.log(`User ${socket.userId} unsubscribed from pages: ${pageIds.join(', ')}`);
    });

    // Leave all page rooms
    socket.on('leave_pages', () => {
      if (socket.userId) {
        socket.leave(`pages_user_${socket.userId}`);
        (socket.subscribedPages || []).forEach(pageId => {
          socket.leave(`page_${pageId}`);
        });
        console.log(`User ${socket.userId} left page rooms`);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from pages:', socket.id);
    });
  });
}

function emitPageUpdate(pageId, action, data) {
  if (!ioInstance) {
    console.warn('Socket.io not initialized for pages');
    return;
  }
  // Emit to clients subscribed to this specific page
  ioInstance.to(`page_${pageId}`).emit('page_update', { pageId, action, data, timestamp: new Date() });
  // Also emit to general pages room for admin users
  ioInstance.to('pages_general').emit('page_update', { pageId, action, data, timestamp: new Date() });
}

function emitPageUpdateToUser(userId, pageId, action, data) {
  if (!ioInstance) {
    console.warn('Socket.io not initialized for pages');
    return;
  }
  ioInstance.to(`pages_user_${userId}`).emit('page_update', { pageId, action, data, timestamp: new Date() });
}

module.exports = { init, emitPageUpdate, emitPageUpdateToUser };