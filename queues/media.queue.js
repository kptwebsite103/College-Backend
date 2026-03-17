const { createQueue } = require('../config/bull');

const mediaQueue = createQueue('media-processing');

mediaQueue.process(async (job) => {
  const { mediaId, action } = job.data;

  console.log(`Processing media job: ${action} for media ${mediaId}`);

  // Import here to avoid circular dependencies
  const { getMediaById, updateMediaById } = require('../modules/media/media.service');
  const { uploadFile } = require('../utils/cloudinary');

  const media = await getMediaById(mediaId);
  if (!media) {
    throw new Error(`Media not found: ${mediaId}`);
  }

  switch (action) {
    case 'upload-to-cloudinary':
    case 'upload-to-imagekit': // Backward compatibility: route to Cloudinary
      // Upload local file to Cloudinary
      const fs = require('fs');
      const path = require('path');
      
      // Read file from local path
      const fileBuffer = fs.readFileSync(media.localPath);
      const fileName = path.basename(media.localPath);
      
      // Determine MIME type
      let mimetype = 'image/jpeg';
      if (media.type === 'video') mimetype = 'video/mp4';
      else if (media.type === 'audio') mimetype = 'audio/mpeg';
      else if (media.type === 'pdf') mimetype = 'application/pdf';
      else if (media.type === 'document') {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['doc', 'docx'].includes(ext)) mimetype = 'application/msword';
        else if (['xls', 'xlsx'].includes(ext)) mimetype = 'application/vnd.ms-excel';
        else if (['ppt', 'pptx'].includes(ext)) mimetype = 'application/vnd.ms-powerpoint';
        else mimetype = 'application/octet-stream';
      }
      
      const file = {
        buffer: fileBuffer,
        originalname: fileName,
        mimetype: mimetype
      };
      
      // Upload to Cloudinary with proper mimetype
      const uploadResult = await uploadFile(file, fileName, 'media-uploads', { resource_type: 'auto' });
      
      if (!uploadResult.success) {
        throw new Error(`Cloudinary upload failed: ${uploadResult.error}`);
      }

      // Update media record with Cloudinary details
      await updateMediaById(mediaId, {
        url: uploadResult.data.url,
        public_id: uploadResult.data.publicId || uploadResult.data.fileId,
        format: uploadResult.data.format,
        size: uploadResult.data.bytes,
        status: 'cloud',
      });

      // Remove local file
      try {
        fs.unlinkSync(media.localPath);
      } catch (e) {
        console.warn(`Failed to delete local file ${media.localPath}:`, e.message);
      }

      // Enqueue other jobs now that it's in cloud
      await mediaQueue.add({ mediaId, action: 'generate-thumbnail' });
      await mediaQueue.add({ mediaId, action: 'extract-metadata' });
      break;

    case 'generate-thumbnail':
      // If it's an image, derive a Cloudinary thumbnail URL
      if (media.type === 'image' && media.public_id) {
        const { cloudinary } = require('../config/cloudinary');
        const thumbnailUrl = cloudinary.url(media.public_id, {
          width: 300,
          height: 300,
          crop: 'fit',
          quality: 'auto',
          fetch_format: 'auto',
        });
        await updateMediaById(mediaId, { thumbnailUrl });
      }
      break;

    case 'extract-metadata':
      // Extract metadata (Cloudinary provides basic metadata)
      const metadata = {
        width: media.width || 0,
        height: media.height || 0,
        duration: media.duration || 0,
        size: media.size || 0,
        fileType: media.type,
      };
      await updateMediaById(mediaId, { metadata });
      break;

    default:
      throw new Error(`Unknown media action: ${action}`);
  }

  console.log(`Media processing completed for ${mediaId}`);
});

module.exports = mediaQueue;
