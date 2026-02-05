/**
 * Utils index - Export all utility modules
 */

const logger = require('./logger');
const { successResponse, errorResponse, paginatedResponse } = require('./response');
const {
  USER_ROLES,
  PAGE_STATUSES,
  WORKFLOW_STATUSES,
  DEFAULT_PAGINATION,
  HTTP_STATUS,
} = require('./constants');
const {
  hashPassword,
  comparePassword,
  generateSalt,
  encrypt,
  decrypt,
  generateToken,
} = require('./encryption');
const {
  getPagination,
  applyPagination,
  getPaginationParams,
} = require('./pagination');
const {
  formatISO,
  formatDate,
  formatDateTime,
  isValidDate,
  addDays,
  addHours,
  startOfDay,
  endOfDay,
  isToday,
  timeAgo,
} = require('./date');
const {
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
} = require('./file');
const slugify = require('./slugify');

module.exports = {
  // Logger
  logger,

  // Response helpers
  successResponse,
  errorResponse,
  paginatedResponse,

  // Constants
  USER_ROLES,
  PAGE_STATUSES,
  WORKFLOW_STATUSES,
  DEFAULT_PAGINATION,
  HTTP_STATUS,

  // Encryption
  hashPassword,
  comparePassword,
  generateSalt,
  encrypt,
  decrypt,
  generateToken,

  // Pagination
  getPagination,
  applyPagination,
  getPaginationParams,

  // Date helpers
  formatISO,
  formatDate,
  formatDateTime,
  isValidDate,
  addDays,
  addHours,
  startOfDay,
  endOfDay,
  isToday,
  timeAgo,

  // File utilities
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

  // Slugify
  slugify,
};