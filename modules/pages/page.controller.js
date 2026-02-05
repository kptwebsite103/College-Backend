const { createPage, getPageById, getPageBySlug, listPages, updatePage, deletePage, publishPage, unpublishPage, schedulePage, rollbackPage } = require('./page.service');
const { createSchema, updateSchema } = require('./page.validation');

async function create(req, res) {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  value.author = req.user && req.user.id ? req.user.id : null;
  try {
    const created = await createPage(value);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create page' });
  }
}

async function list(req, res) {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.departmentId) filter.departmentId = req.query.departmentId;
  const pages = await listPages(filter, { limit: parseInt(req.query.limit) || 50 });
  res.json(pages);
}

async function get(req, res) {
  const page = await getPageById(req.params.id);
  if (!page) return res.status(404).json({ message: 'Not found' });
  res.json(page);
}

async function getBySlug(req, res) {
  const page = await getPageBySlug(req.params.slug);
  if (!page) return res.status(404).json({ message: 'Not found' });
  res.json(page);
}

async function update(req, res) {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  value.updatedBy = req.user && req.user.id ? req.user.id : null;
  try {
    const updated = await updatePage(req.params.id, value);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update page' });
  }
}

async function publish(req, res) {
  try {
    const updated = await publishPage(req.params.id, req.user && req.user.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to publish page' });
  }
}

async function unpublish(req, res) {
  try {
    const updated = await unpublishPage(req.params.id, req.user && req.user.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to unpublish page' });
  }
}

async function schedule(req, res) {
  const { scheduledAt } = req.body;
  if (!scheduledAt) return res.status(400).json({ message: 'scheduledAt required' });
  try {
    const dt = new Date(scheduledAt);
    if (isNaN(dt.getTime())) return res.status(400).json({ message: 'Invalid date' });
    const updated = await schedulePage(req.params.id, dt, req.user && req.user.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to schedule page' });
  }
}

async function rollback(req, res) {
  const { versionIndex } = req.body;
  if (typeof versionIndex !== 'number') return res.status(400).json({ message: 'versionIndex (number) required' });
  try {
    const updated = await rollbackPage(req.params.id, versionIndex, req.user && req.user.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to rollback page' });
  }
}

async function remove(req, res) {
  try {
    await deletePage(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete page' });
  }
}

module.exports = { create, list, get, update, publish, unpublish, schedule, rollback, remove };
