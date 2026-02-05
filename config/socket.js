const { Server } = require('socket.io');

// Socket config factory. Only configuration and plumbing here; no business logic.
function createSocketServer(httpServer, opts = {}) {
  const corsOrigin = process.env.SOCKET_CORS_ORIGIN || '*';
  const corsMethods = (process.env.SOCKET_CORS_METHODS || 'GET,POST').split(',').map(s => s.trim());

  const defaultOpts = {
    cors: {
      origin: corsOrigin,
      methods: corsMethods,
      allowedHeaders: ['Authorization', 'Content-Type'],
      credentials: process.env.SOCKET_CORS_CREDENTIALS === 'true',
    },
    path: process.env.SOCKET_PATH || '/socket.io',
    ...opts,
  };

  const io = new Server(httpServer, defaultOpts);

  // Helper: create or return a namespace socket instance
  function getNamespace(ns = '/') {
    if (ns === '/' || ns === '') return io; // root
    return io.of(ns);
  }

  // Helper to gracefully close socket server
  async function close(timeout = Number(process.env.SOCKET_CLOSE_TIMEOUT_MS || 5000)) {
    try {
      // stop accepting new connections; close existing with timeout
      await io.close();
      // Note: socket.io v4 `io.close()` returns a Promise that resolves when complete
    } catch (err) {
      console.warn('Error closing socket server:', err && err.message ? err.message : err);
      throw err;
    }
  }

  return { io, getNamespace, close };
}

module.exports = { createSocketServer };
