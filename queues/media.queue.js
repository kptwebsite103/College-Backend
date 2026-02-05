const { createQueue } = require('../config/bull');

const mediaQueue = createQueue('media-processing');

mediaQueue.process(async (job) => {
  const { mediaId, action } = job.data;

  console.log(`Processing media job: ${action} for media ${mediaId}`);

  // Import here to avoid circular dependencies
  const Media = require('../modules/media/media.model');
  const { uploadFile } = require('../utils/imagekit');

  const media = await Media.findById(mediaId);
  if (!media) {
    throw new Error(`Media not found: ${mediaId}`);
  }

  switch (action) {
    case 'upload-to-imagekit':
      // Upload local file to ImageKit
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
      
      // Upload to ImageKit with proper mimetype
      const uploadResult = await uploadFile(file, fileName, 'media-uploads', { mimetype });
      
      if (!uploadResult.success) {
        throw new Error(`ImageKit upload failed: ${uploadResult.error}`);
      }

      // Update media record with ImageKit details
      await Media.findByIdAndUpdate(mediaId, {
        url: uploadResult.data.url,
        fileId: uploadResult.data.fileId,
        thumbnailUrl: uploadResult.data.thumbnailUrl,
        fileType: uploadResult.data.fileType,
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
      // For ImageKit, thumbnail URL is already provided
      // If it's an image and no thumbnail exists, we can use ImageKit transformations
      if (media.fileType === 'image' && !media.thumbnailUrl) {
        const thumbnailUrl = `${media.url}?tr=w-300,h-300,c-at_max,q-80`;
        await Media.findByIdAndUpdate(mediaId, { thumbnailUrl });
      }
      break;

    case 'extract-metadata':
      // Extract metadata (ImageKit provides basic metadata)
      const metadata = {
        width: media.width || 0,
        height: media.height || 0,
        duration: media.duration || 0,
        size: media.size || 0,
        fileType: media.fileType || media.type,
      };
      await Media.findByIdAndUpdate(mediaId, { metadata });
      break;

    default:
      throw new Error(`Unknown media action: ${action}`);
  }

  console.log(`Media processing completed for ${mediaId}`);
});

module.exports = mediaQueue;