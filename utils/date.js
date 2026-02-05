/**
 * Date utility functions
 */

/**
 * Format date to ISO string
 * @param {Date|string} date
 * @returns {string} ISO date string
 */
const formatISO = (date) => {
  const d = new Date(date);
  return d.toISOString();
};

/**
 * Format date to readable string
 * @param {Date|string} date
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted date
 */
const formatDate = (date, locale = 'en-US') => {
  const d = new Date(date);
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format date and time
 * @param {Date|string} date
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted date and time
 */
const formatDateTime = (date, locale = 'en-US') => {
  const d = new Date(date);
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Check if date is valid
 * @param {any} date
 * @returns {boolean}
 */
const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

/**
 * Add days to a date
 * @param {Date|string} date
 * @param {number} days
 * @returns {Date}
 */
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Add hours to a date
 * @param {Date|string} date
 * @param {number} hours
 * @returns {Date}
 */
const addHours = (date, hours) => {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
};

/**
 * Get start of day
 * @param {Date|string} date
 * @returns {Date}
 */
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of day
 * @param {Date|string} date
 * @returns {Date}
 */
const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Check if date is today
 * @param {Date|string} date
 * @returns {boolean}
 */
const isToday = (date) => {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

/**
 * Get time difference in human readable format
 * @param {Date|string} date
 * @returns {string}
 */
const timeAgo = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return formatDate(d);
};

module.exports = {
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
};