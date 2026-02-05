const { createMediaFromUpload } = require('./media.service');
const { getAuthenticationParameters } = require('../../utils/imagekit');
const { uploadSchema, signSchema } = require('./media.validation');
const Media = require('./media.model');

async function list(req, res) {
  try {
    const media = await Media.find().sort({ createdAt: -1 });
    res.json(media);
  } catch (err) {
    console.error('Media list error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch media' });
  }
}

async function upload(req, res) {
  if (!req.file) return res.status(400).json({ message: 'file is required' });

  const { error, value } = uploadSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const uploadedBy = req.user && req.user.id ? req.user.id : null;
    const departmentId = value.departmentId || null;
    const tags = value.tags || [];

    const media = await createMediaFromUpload({ filePath: req.file.path, filename: req.file.originalname, uploadedBy, departmentId, tags });
    res.status(201).json(media);
  } catch (err) {
    console.error('Media upload error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Upload failed' });
  }
}

// Returns ImageKit authentication parameters for client direct uploads
function sign(req, res) {
  const { error, value } = signSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    // Get authentication parameters from ImageKit
    const authResult = getAuthenticationParameters();
    
    if (!authResult.success) {
      return res.status(500).json({ message: 'Could not generate authentication parameters' });
    }

    // Return ImageKit authentication parameters
    res.json({
      token: authResult.data.token,
      expire: authResult.data.expire,
      signature: authResult.data.signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || null,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || null
    });
  } catch (err) {
    console.error('Sign error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Could not generate authentication parameters' });
  }
}

module.exports = { list, upload, sign };
