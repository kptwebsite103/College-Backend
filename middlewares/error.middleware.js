module.exports = function errorHandler(err, req, res, next) {
  // If headers are already sent, delegate to default handler
  if (res.headersSent) return next(err);

  // Try to determine status
  const status = err && err.status ? err.status : 500;
  const message = err && err.message ? err.message : 'Internal Server Error';

  // Log server-side errors
  if (status >= 500) {
    console.error('Unhandled error:', err && (err.stack || err));
  } else {
    console.warn('Client error:', message);
  }

  res.status(status).json({ message });
};
