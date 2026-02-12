const Media = require('./media.model');
const { uploadFile } = require('../../utils/cloudinary');

function detectType(filename, mimetype) {
  if (mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype === 'application/pdf') return 'pdf';
    if (
      [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
      ].includes(mimetype)
    ) {
      return 'document';
    }
  }

  const ext = filename.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(ext)) return 'document';
  return 'file';
}

async function createMediaFromUpload({ file, filename, title, uploadedBy, departmentId, tags = [], folder }) {
  if (!file || !file.buffer) {
    throw new Error('No file data received');
  }

  const uploadResult = await uploadFile(file, filename, folder || 'media');
  if (!uploadResult.success) {
    throw new Error(uploadResult.error || 'Cloudinary upload failed');
  }

  const type = detectType(filename, file.mimetype);

  const doc = new Media({
    url: uploadResult.data.url,
    public_id: uploadResult.data.publicId || uploadResult.data.fileId,
    title: title || '',
    filename: filename,
    thumbnailUrl: uploadResult.data.thumbnailUrl || null,
    format: uploadResult.data.format,
    size: uploadResult.data.bytes,
    type: type,
    tags,
    uploadedBy,
    departmentId,
    status: 'cloud',
  });

  return await doc.save();
}

module.exports = { createMediaFromUpload };
