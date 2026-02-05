/**
 * Pagination utilities
 */

/**
 * Calculate pagination metadata
 * @param {number} page - Current page (1-based)
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {object} Pagination metadata
 */
const getPagination = (page = 1, limit = 50, total = 0) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const itemsPerPage = Math.max(1, parseInt(limit, 10) || 50);
  const totalPages = Math.ceil(total / itemsPerPage);
  const skip = (currentPage - 1) * itemsPerPage;

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems: total,
    skip,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
  };
};

/**
 * Apply pagination to a MongoDB query
 * @param {object} query - Mongoose query object
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Query with pagination applied
 */
const applyPagination = (query, page = 1, limit = 50) => {
  const { skip, itemsPerPage } = getPagination(page, limit);
  return query.skip(skip).limit(itemsPerPage);
};

/**
 * Get pagination info from request query
 * @param {object} query - Express req.query
 * @returns {object} { page, limit }
 */
const getPaginationParams = (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 50, 100); // Max 100
  return { page, limit };
};

module.exports = {
  getPagination,
  applyPagination,
  getPaginationParams,
};