const { createMediaFromUpload, listCloudMedia, updateMediaById, getMediaById, deleteMediaById } = require('./media.service');
const { getAuthenticationParameters, deleteFile } = require('../../utils/cloudinary');
const { uploadSchema, updateSchema, signSchema } = require('./media.validation');

async function list(req, res) {
  try {
    const media = await listCloudMedia();
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
    const title = value.title || '';
    const folder = value.folder || 'media';

    const media = await createMediaFromUpload({
      file: req.file,
      filename: req.file.originalname,
      title,
      uploadedBy,
      departmentId,
      tags,
      folder,
    });
    res.status(201).json(media);
  } catch (err) {
    const message = err && err.message ? err.message : 'Upload failed';
    const status =
      err && err.status
        ? err.status
        : /not configured|invalid file|file type|file size/i.test(message)
          ? 400
          : 500;
    console.error('Media upload error:', message);
    res.status(status).json({ message });
  }
}

// Returns Cloudinary signature for client direct uploads
function sign(req, res) {
  const { error, value } = signSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const authResult = getAuthenticationParameters(value || {});

    if (!authResult.success) {
      return res.status(500).json({ message: authResult.error || 'Could not generate authentication parameters' });
    }

    res.json({
      signature: authResult.data.signature,
      timestamp: authResult.data.timestamp,
      apiKey: authResult.data.apiKey,
      cloudName: authResult.data.cloudName,
      folder: authResult.data.folder,
      public_id: authResult.data.public_id,
      resource_type: authResult.data.resource_type,
      eager: authResult.data.eager,
    });
  } catch (err) {
    console.error('Sign error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Could not generate authentication parameters' });
  }
}

async function update(req, res) {
  const { error, value } = updateSchema.validate(req.body || {});
  if (error) return res.status(400).json({ message: error.message });

  try {
    const updated = await updateMediaById(req.params.id, value);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('Media update error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Failed to update media' });
  }
}

async function remove(req, res) {
  try {
    const media = await getMediaById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Not found' });

    if (media.public_id) {
      try {
        await deleteFile(media.public_id);
      } catch (error) {
        console.warn('Cloudinary delete failed:', error && error.message ? error.message : error);
      }
    }

    await deleteMediaById(media._id || media.id);
    res.status(204).end();
  } catch (err) {
    console.error('Media delete error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Failed to delete media' });
  }
}

module.exports = { list, upload, sign, update, remove };
