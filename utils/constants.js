/**
 * Application constants
 */

const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  FACULTY: 'faculty',
};

const PAGE_STATUSES = {
  DRAFT: 'draft',
  REVIEW: 'review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

const WORKFLOW_STATUSES = {
  IN_PROGRESS: 'in_progress',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
};

const DEFAULT_PAGINATION = {
  LIMIT: 50,
  MAX_LIMIT: 100,
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

module.exports = {
  USER_ROLES,
  PAGE_STATUSES,
  WORKFLOW_STATUSES,
  DEFAULT_PAGINATION,
  HTTP_STATUS,
};