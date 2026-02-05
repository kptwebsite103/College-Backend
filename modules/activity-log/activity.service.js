const Activity = require('./activity.model');

async function createActivity(entry) {
  const a = new Activity(entry);
  return a.save();
}

async function listActivities(filter = {}, options = {}) {
  const q = Activity.find(filter).sort({ createdAt: -1 });
  if (options.limit) q.limit(parseInt(options.limit, 10));
  if (options.skip) q.skip(parseInt(options.skip, 10));
  return q.lean();
}

module.exports = { createActivity, listActivities };
