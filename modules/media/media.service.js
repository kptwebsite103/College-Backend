const Media = require('./media.model');
const { uploadFile } = require('../../utils/imagekit');
const fs = require('fs');
const path = require('path');

async function uploadFileToImageKit(filePath, options = {}) {
  // Read file from disk
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  
  // Create file object for ImageKit with proper mimetype detection
  const file = {
    buffer: fileBuffer,
    originalname: fileName,
    mimetype: options.mimetype || 'application/octet-stream'
  };
  
  // Upload to ImageKit
  const result = await uploadFile(file, fileName, options.folder || 'media-uploads');
  return result;
}

async function createMediaFromUpload({ filePath, filename, uploadedBy, departmentId, tags = [] }) {
  // Get file stats
  const stats = fs.statSync(filePath);
  const size = stats.size;

  // Determine file type (simple check)
  const ext = filename.split('.').pop().toLowerCase();
  let type = 'file';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) type = 'image';
  else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) type = 'video';
  else if (['mp3', 'wav', 'flac'].includes(ext)) type = 'audio';
  else if (ext === 'pdf') type = 'pdf';
  else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(ext)) type = 'document';

  const doc = new Media({
    url: `/uploads/${path.basename(filePath)}`, // local url initially
    filename: filename,
    size: size,
    type: type,
    tags,
    uploadedBy,
    departmentId,
    localPath: filePath,
    status: 'local',
  });

  const savedMedia = await doc.save();

  // Enqueue background job to upload to ImageKit
  const mediaQueue = require('../../queues/media.queue');
  await mediaQueue.add({ mediaId: savedMedia._id, action: 'upload-to-imagekit' });

  return savedMedia;
}

module.exports = { uploadFileToImageKit, createMediaFromUpload };
