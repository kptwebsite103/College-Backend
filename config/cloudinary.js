const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

/**
 * Configure Cloudinary client from environment variables.
 * Supports either a single `CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` trio.
 */
function configure() {
  const { CLOUDINARY_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: CLOUDINARY_URL });
    return cloudinary;
  }

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary env vars not fully set: provide CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET');
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  return cloudinary;
}

/**
 * Upload a file (local path, remote URL, or base64/data URL) using Cloudinary.
 * Returns a Promise resolving with the upload result.
 */
function upload(source, options = {}) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(source, options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Upload from a readable stream (Buffer or Node stream)
 * Example usage:
 *   await uploadStream(bufferOrStream, { folder: 'uploads' });
 */
function uploadStream(input, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });

      // If input is a Buffer, convert to a Readable stream
    if (Buffer.isBuffer(input)) {
      const readable = Readable.from([input]);
      readable.pipe(uploadStream);
    } else if (input && typeof input.pipe === 'function') {
      input.pipe(uploadStream);
    } else {
      reject(new Error('Invalid input for uploadStream: expected Buffer or readable stream'));
    }
  });
}

/**
 * Delete a resource by public_id
 */
function destroy(publicId, options = {}) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function isConfigured() {
  const cfg = cloudinary.config && cloudinary.config().cloud_name;
  return Boolean(cfg);
}

module.exports = {
  cloudinary,
  configure,
  upload,
  uploadStream,
  destroy,
  isConfigured,
};
