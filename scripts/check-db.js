require('dotenv').config();
const { connect, disconnect } = require('../config/database');

(async () => {
  try {
    console.log('Connecting to DB...');
    await connect(process.env.MONGODB_URI);
    console.log('Connection successful — disconnecting...');
    await disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('DB check failed:', err.message);
    process.exit(1);
  }
})();
