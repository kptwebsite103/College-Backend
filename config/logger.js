const winston = require('winston');
const fs = require('fs');
const path = require('path');

const transports = [
  new winston.transports.Console({
    format: winston.format.simple()
  })
];

// Only use file logging locally (not in production/serverless)
if (process.env.NODE_ENV !== 'production') {
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      format: winston.format.json()
    })
  );
}

const logger = winston.createLogger({
  level: 'info',
  transports
});

module.exports = logger;
