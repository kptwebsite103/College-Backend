const { createSocketServer } = require('../config/socket');
const { init: initMainSocket } = require('../sockets/analytics.socket');

let srvHandle = null; // { io, getNamespace, close }

module.exports = {
  init(httpServer) {
    if (srvHandle) return srvHandle;
    const w = createSocketServer(httpServer);
    srvHandle = w;
    // Initialize main real-time socket handler
    initMainSocket(w.io);
    return srvHandle;
  },
  async close() {
    if (!srvHandle) return;
    try {
      await srvHandle.close();
    } catch (err) {
      console.warn('Error closing sockets:', err && err.message ? err.message : err);
    }
    srvHandle = null;
  },
};