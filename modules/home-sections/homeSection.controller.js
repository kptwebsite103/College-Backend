const {
  createHomeSection,
  listHomeSections,
  getHomeSection,
  updateHomeSection,
  removeHomeSection,
  getActiveHomeSections
} = require('./homeSection.service');
const { createSchema, updateSchema } = require('./homeSection.validation');

async function create(req, res) {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const doc = await createHomeSection(value);
    res.status(201).json(doc);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ message: err.message });
    console.error('Create home section error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Failed to create' });
  }
}

async function list(req, res) {
  const { limit, skip, active, q, type, departmentId } = req.query;
  const docs = await listHomeSections({
    limit: limit ? Number(limit) : undefined,
    skip: skip ? Number(skip) : undefined,
    active: active === 'true' ? true : active === 'false' ? false : undefined,
    q,
    type,
    departmentId
  });
  res.json(docs);
}

async function listActive(req, res) {
  const { departmentId } = req.query;
  const docs = await getActiveHomeSections(departmentId);
  res.json(docs);
}

async function getById(req, res) {
  const doc = await getHomeSection(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

async function update(req, res) {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const doc = await updateHomeSection(req.params.id, value);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ message: err.message });
    console.error('Update home section error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Failed to update' });
  }
}

async function remove(req, res) {
  const doc = await removeHomeSection(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
}

module.exports = { create, list, listActive, getById, update, remove };