const fs = require('fs').promises;
const path = require('path');

/**
 * Check if file exists
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Read file content
 * @param {string} filePath
 * @param {string} encoding - Default 'utf8'
 * @returns {Promise<string|Buffer>}
 */
const readFile = async (filePath, encoding = 'utf8') => {
  return await fs.readFile(filePath, encoding);
};

/**
 * Write file content
 * @param {string} filePath
 * @param {string|Buffer} content
 * @param {string} encoding - Default 'utf8'
 * @returns {Promise<void>}
 */
const writeFile = async (filePath, content, encoding = 'utf8') => {
  // Ensure directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  return await fs.writeFile(filePath, content, encoding);
};

/**
 * Delete file
 * @param {string} filePath
 * @returns {Promise<void>}
 */
const deleteFile = async (filePath) => {
  return await fs.unlink(filePath);
};

/**
 * Get file stats
 * @param {string} filePath
 * @returns {Promise<fs.Stats>}
 */
const getFileStats = async (filePath) => {
  return await fs.stat(filePath);
};

/**
 * Get file size in bytes
 * @param {string} filePath
 * @returns {Promise<number>}
 */
const getFileSize = async (filePath) => {
  const stats = await fs.stat(filePath);
  return stats.size;
};

/**
 * Create directory recursively
 * @param {string} dirPath
 * @returns {Promise<void>}
 */
const createDirectory = async (dirPath) => {
  return await fs.mkdir(dirPath, { recursive: true });
};

/**
 * Read directory contents
 * @param {string} dirPath
 * @returns {Promise<string[]>}
 */
const readDirectory = async (dirPath) => {
  return await fs.readdir(dirPath);
};

/**
 * Copy file
 * @param {string} src
 * @param {string} dest
 * @returns {Promise<void>}
 */
const copyFile = async (src, dest) => {
  const destDir = path.dirname(dest);
  await fs.mkdir(destDir, { recursive: true });
  return await fs.copyFile(src, dest);
};

/**
 * Move/rename file
 * @param {string} oldPath
 * @param {string} newPath
 * @returns {Promise<void>}
 */
const moveFile = async (oldPath, newPath) => {
  const newDir = path.dirname(newPath);
  await fs.mkdir(newDir, { recursive: true });
  return await fs.rename(oldPath, newPath);
};

/**
 * Get file extension
 * @param {string} filePath
 * @returns {string}
 */
const getFileExtension = (filePath) => {
  return path.extname(filePath).toLowerCase();
};

/**
 * Get file name without extension
 * @param {string} filePath
 * @returns {string}
 */
const getFileName = (filePath) => {
  return path.basename(filePath, path.extname(filePath));
};

module.exports = {
  fileExists,
  readFile,
  writeFile,
  deleteFile,
  getFileStats,
  getFileSize,
  createDirectory,
  readDirectory,
  copyFile,
  moveFile,
  getFileExtension,
  getFileName,
};