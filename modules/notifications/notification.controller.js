const { listNotifications, markAsRead, getNotification } = require('./notification.service');
const { listSchema } = require('./notification.validation');

async function list(req, res) {
  const { error, value } = listSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  const docs = await listNotifications(req.user.id, value);
  res.json(docs);
}

async function getById(req, res) {
  const doc = await getNotification(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

async function markRead(req, res) {
  const doc = await markAsRead(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

module.exports = { list, getById, markRead };