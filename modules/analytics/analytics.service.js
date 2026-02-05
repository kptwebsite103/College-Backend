const Analytics = require('./analytics.model');

async function createAnalytics(payload) {
  const doc = new Analytics(payload);
  return doc.save();
}

async function listAnalytics({ limit = 20, skip = 0, event, userId, sessionId } = {}) {
  const filter = {};
  if (event) filter.event = event;
  if (userId) filter.userId = userId;
  if (sessionId) filter.sessionId = sessionId;
  return Analytics.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

async function getAnalytics(id) {
  return Analytics.findById(id);
}

async function getPageViewsReport({ startDate, endDate, groupBy = 'day' } = {}) {
  const match = { event: 'page_view' };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const groupId = groupBy === 'hour' ? { $dateToString: { format: '%Y-%m-%d %H', date: '$createdAt' } } :
                groupBy === 'day' ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } :
                groupBy === 'month' ? { $dateToString: { format: '%Y-%m', date: '$createdAt' } } : '$createdAt';

  return Analytics.aggregate([
    { $match: match },
    {
      $group: {
        _id: groupId,
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSessions: { $addToSet: '$sessionId' },
      }
    },
    {
      $project: {
        date: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueSessions: { $size: '$uniqueSessions' },
      }
    },
    { $sort: { date: 1 } }
  ]);
}

async function getUserActivityReport({ startDate, endDate, userId, groupBy = 'day' } = {}) {
  const match = { event: 'user_activity' };
  if (userId) match.userId = userId;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const groupId = groupBy === 'hour' ? { $dateToString: { format: '%Y-%m-%d %H', date: '$createdAt' } } :
                groupBy === 'day' ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } :
                groupBy === 'month' ? { $dateToString: { format: '%Y-%m', date: '$createdAt' } } : '$createdAt';

  return Analytics.aggregate([
    { $match: match },
    {
      $group: {
        _id: groupId,
        count: { $sum: 1 },
        users: { $addToSet: '$userId' },
        actions: { $push: '$data.action' },
      }
    },
    {
      $project: {
        date: '$_id',
        count: 1,
        uniqueUsers: { $size: '$users' },
        actions: 1,
      }
    },
    { $sort: { date: 1 } }
  ]);
}

async function getGeneralReport({ startDate, endDate } = {}) {
  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  return Analytics.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$event',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSessions: { $addToSet: '$sessionId' },
      }
    },
    {
      $project: {
        event: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueSessions: { $size: '$uniqueSessions' },
      }
    },
    { $sort: { count: -1 } }
  ]);
}

module.exports = { createAnalytics, listAnalytics, getAnalytics, getPageViewsReport, getUserActivityReport, getGeneralReport };