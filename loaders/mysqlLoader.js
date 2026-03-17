require('dotenv').config();
const { connectWithRetry } = require('../config/database');
const logger = require('../config/logger');

module.exports = async function mysqlLoader() {
  const dbRequired = String(process.env.DB_REQUIRED || 'true').toLowerCase() !== 'false';
  try {
    const attempts = dbRequired ? Number(process.env.DB_CONN_RETRY_ATTEMPTS || 5) : 1;
    const delayMs = dbRequired ? Number(process.env.DB_CONN_RETRY_DELAY_MS || 2000) : 0;

    await connectWithRetry({
      attempts,
      delayMs,
      onAttempt: () => {},
    });

    logger.info('MySQL loader initialized');
  } catch (err) {
    if (!dbRequired) {
      logger.warn(
        `MySQL not reachable (DB_REQUIRED=false). Continuing without DB. Error: ${err && err.message ? err.message : err}`,
      );
      return;
    }
    throw err;
  }
};
