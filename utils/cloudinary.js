const { cloudinary, configure } = require('../config/cloudinary');

function ensureConfigured() {
  try {
    configure();
  } catch (_) {
    // Configure already logs warnings for missing env vars.
  }

  if (typeof cloudinary.config === 'function') {
    const cfg = cloudinary.config();
    if (!cfg || !cfg.cloud_name) {
      throw new Error(
        'Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET'
      );
    }
  }
}

function sanitizeOptions(options = {}) {
  const cleaned = {};
  Object.keys(options).forEach((key) => {
    if (options[key] !== undefined && options[key] !== null && options[key] !== '') {
      cleaned[key] = options[key];
    }
  });
  return cleaned;
}

async function uploadFile(file, fileName, folder = 'college-files', options = {}) {
  try {
    if (!file || !file.buffer) {
      throw new Error('Invalid file payload');
    }

    ensureConfigured();

    const uploadOptions = sanitizeOptions({
      folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
      filename_override: fileName,
      ...options,
    });

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });

      uploadStream.end(file.buffer);
    });

    const thumbnailUrl =
      result && result.resource_type === 'image'
        ? cloudinary.url(result.public_id, {
            width: 300,
            height: 300,
            crop: 'fit',
            quality: 'auto',
            fetch_format: 'auto',
          })
        : null;

    return {
      success: true,
      data: {
        fileId: result.public_id,
        publicId: result.public_id,
        url: result.secure_url,
        thumbnailUrl,
        format: result.format,
        bytes: result.bytes,
        resourceType: result.resource_type,
        originalFilename: result.original_filename || fileName,
      },
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return { success: false, error: error.message };
  }
}

async function deleteFile(publicId, options = {}) {
  try {
    ensureConfigured();

    const requestedType = options.resource_type === 'auto' ? undefined : options.resource_type;
    const resourceTypes = requestedType ? [requestedType] : ['image', 'video', 'raw'];
    const destroyOptions = sanitizeOptions({ type: 'upload', ...options });

    let lastResult = null;
    for (const resource_type of resourceTypes) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, { ...destroyOptions, resource_type }, (err, res) => {
          if (err) return reject(err);
          resolve(res);
        });
      });

      lastResult = result;
      if (result && result.result === 'ok') {
        return { success: true, data: result, resourceType: resource_type };
      }
    }

    return {
      success: false,
      error: lastResult && lastResult.result ? `Cloudinary delete failed: ${lastResult.result}` : 'Delete failed',
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return { success: false, error: error.message };
  }
}

async function listFiles(folder = 'college-files', cursor = null, limit = 100) {
  try {
    ensureConfigured();

    const prefix = folder ? `${folder}/` : undefined;
    const resourceTypes = ['image', 'video', 'raw'];
    const resources = [];
    const nextCursors = {};

    for (const resource_type of resourceTypes) {
      const response = await cloudinary.api.resources({
        type: 'upload',
        prefix,
        max_results: limit,
        resource_type,
        next_cursor: cursor || undefined,
      });

      if (Array.isArray(response.resources)) {
        resources.push(...response.resources);
      }
      if (response.next_cursor) {
        nextCursors[resource_type] = response.next_cursor;
      }
    }

    return { success: true, data: resources, nextCursors };
  } catch (error) {
    console.error('Cloudinary list error:', error);
    return { success: false, error: error.message };
  }
}

function getAuthenticationParameters(params = {}) {
  try {
    ensureConfigured();

    const timestamp = Math.round(Date.now() / 1000);
    const baseParams = sanitizeOptions({
      timestamp,
      folder: params.folder,
      public_id: params.public_id,
      eager: params.eager,
      resource_type: params.resource_type || 'auto',
    });

    const apiSecret =
      process.env.CLOUDINARY_API_SECRET ||
      (typeof cloudinary.config === 'function' ? cloudinary.config().api_secret : undefined);

    if (!apiSecret) {
      throw new Error('Cloudinary API secret missing for signed uploads');
    }

    const signature = cloudinary.utils.api_sign_request(baseParams, apiSecret);
    const apiKey =
      process.env.CLOUDINARY_API_KEY ||
      (typeof cloudinary.config === 'function' ? cloudinary.config().api_key : undefined);
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      (typeof cloudinary.config === 'function' ? cloudinary.config().cloud_name : undefined);

    return {
      success: true,
      data: {
        ...baseParams,
        signature,
        apiKey,
        cloudName,
      },
    };
  } catch (error) {
    console.error('Cloudinary auth params error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  cloudinary,
  uploadFile,
  deleteFile,
  listFiles,
  getAuthenticationParameters,
};
