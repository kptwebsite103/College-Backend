const { createBackup, listBackups, getBackup } = require('./backup.service');
const { createSchema, listSchema } = require('./backup.validation');

async function create(req, res) {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const payload = { ...value, createdBy: req.user.id };
  const doc = await createBackup(payload);
  res.status(201).json(doc);
}

async function list(req, res) {
  const { error, value } = listSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  const docs = await listBackups(value);
  res.json(docs);
}

async function getById(req, res) {
  const doc = await getBackup(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

module.exports = { create, list, getById };