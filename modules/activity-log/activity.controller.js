const { listActivities } = require('./activity.service');
const { listSchema } = require('./activity.validation');

async function list(req, res) {
  const { error, value } = listSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  const filter = {};
  if (value.resourceType) filter.resourceType = value.resourceType;
  if (value.resourceId) filter.resourceId = value.resourceId;
  if (value.actorId) filter.actorId = value.actorId;

  const activities = await listActivities(filter, { limit: value.limit || 100 });
  res.json(activities);
}

module.exports = { list };