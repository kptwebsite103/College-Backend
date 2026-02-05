// ❌ REMOVE dotenv — Vercel provides env automatically
// require('dotenv').config();

const startLoaders = require('../loaders');
const app = require('../app');

let initialized = false;
let initError = null;

async function initOnce() {
  if (initialized) return;
  if (initError) throw initError;

  try {
    const loaders = await startLoaders();
    loaders.express.init(app);
    initialized = true;
    console.log("Loaders initialized");
  } catch (err) {
    console.error("Initialization error:", err);
    initError = err;
    throw err;
  }
}

// Initialize safely per request
module.exports = async (req, res) => {
  try {
    await initOnce();
    return app(req, res);
  } catch (err) {
    const message = err && err.message ? err.message : 'Initialization failed';
    const status = err && err.status ? err.status : 500;
    if (!res.headersSent) {
      return res.status(status).json({ message });
    }
    throw err;
  }
};
