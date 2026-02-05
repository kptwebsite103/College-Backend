const { createMenu, listMenus, getMenu, updateMenu, removeMenu } = require('./menu.service');
const { createSchema, updateSchema } = require('./menu.validation');

async function create(req, res) {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const doc = await createMenu(value);
    res.status(201).json(doc);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ message: err.message });
    console.error('Create menu error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Failed to create' });
  }
}

async function list(req, res) {
  const { limit, skip, active, q, type } = req.query;
  const docs = await listMenus({ limit: limit ? Number(limit) : undefined, skip: skip ? Number(skip) : undefined, active: active === 'true' ? true : active === 'false' ? false : undefined, q, type });
  res.json(docs);
}

async function listByType(req, res) {
  const { type } = req.params;
  const { limit, skip, active, q } = req.query;
  const docs = await listMenus({ limit: limit ? Number(limit) : undefined, skip: skip ? Number(skip) : undefined, active: active === 'true' ? true : active === 'false' ? false : undefined, q, type });
  res.json(docs);
}

async function getById(req, res) {
  const doc = await getMenu(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

async function update(req, res) {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const doc = await updateMenu(req.params.id, value);
    res.json(doc);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ message: err.message });
    console.error('Update menu error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Failed to update' });
  }
}

async function remove(req, res) {
  await removeMenu(req.params.id);
  res.status(204).end();
}

module.exports = { create, list, listByType, getById, update, remove };
