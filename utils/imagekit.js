const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

// Upload file to ImageKit
const uploadFile = async (file, fileName, folder = "college-files") => {
  try {
    const uploadOptions = {
      file: file.buffer,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
    };

    // Add file type specific configurations - ONLY for images
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      uploadOptions.transformation = {
        pre: 'l-auto,w-800,h-600,c-at_max'
      };
    }

    const response = await imagekit.upload(uploadOptions);
    return {
      success: true,
      data: {
        fileId: response.fileId,
        name: response.name,
        url: response.url,
        thumbnailUrl: response.thumbnailUrl,
        fileType: response.fileType,
        size: response.size,
        folder: response.folder
      }
    };
  } catch (error) {
    console.error('ImageKit upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file from ImageKit
const deleteFile = async (fileId) => {
  try {
    await imagekit.deleteFile(fileId);
    return {
      success: true,
      message: 'File deleted successfully'
    };
  } catch (error) {
    console.error('ImageKit delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get file details
const getFileDetails = async (fileId) => {
  try {
    const response = await imagekit.getFileDetails(fileId);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('ImageKit get file details error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// List files in folder
const listFiles = async (folder = "college-files", skip = 0, limit = 100) => {
  try {
    const response = await imagekit.listFiles({
      path: folder,
      skip: skip,
      limit: limit
    });
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('ImageKit list files error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get authentication parameters for client-side uploads
const getAuthenticationParameters = () => {
  try {
    const authParams = imagekit.getAuthenticationParameters();
    return {
      success: true,
      data: authParams
    };
  } catch (error) {
    console.error('ImageKit auth params error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  imagekit,
  uploadFile,
  deleteFile,
  getFileDetails,
  listFiles,
  getAuthenticationParameters
};
