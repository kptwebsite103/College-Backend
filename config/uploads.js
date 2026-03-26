const path = require('path');

function resolveUploadsRoot() {
  const configured = String(process.env.UPLOADS_DIR || '').trim();
  if (!configured) {
    return path.join(__dirname, '..', 'public', 'uploads');
  }
  return path.isAbsolute(configured)
    ? configured
    : path.join(__dirname, '..', configured);
}

module.exports = {
  UPLOADS_ROOT: resolveUploadsRoot(),
};
