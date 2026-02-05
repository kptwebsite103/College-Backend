const { createPage, getPageById, getPageBySlug, listPages, updatePage, deletePage, publishPage, unpublishPage, schedulePage, rollbackPage } = require('./page.service.simple');

// Controller functions
async function create(req, res) {
  try {
    const created = await createPage(req.body);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create page error:', err);
    res.status(500).json({ message: 'Failed to create page' });
  }
}

async function list(req, res) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.departmentId) filter.departmentId = req.query.departmentId;
    
    const pages = await listPages(filter, { limit: parseInt(req.query.limit) || 50 });
    res.json(pages);
  } catch (err) {
    console.error('List pages error:', err);
    res.status(500).json({ message: 'Failed to list pages' });
  }
}

async function get(req, res) {
  try {
    const page = await getPageById(req.params.id);
    if (!page) return res.status(404).json({ message: 'Not found' });
    res.json(page);
  } catch (err) {
    console.error('Get page error:', err);
    res.status(500).json({ message: 'Failed to get page' });
  }
}

async function getBySlug(req, res) {
  try {
    const page = await getPageBySlug(req.params.slug);
    if (!page) return res.status(404).json({ message: 'Not found' });
    res.json(page);
  } catch (err) {
    console.error('Get page by slug error:', err);
    res.status(500).json({ message: 'Failed to get page by slug' });
  }
}

async function update(req, res) {
  try {
    const updated = await updatePage(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update page error:', err);
    res.status(500).json({ message: 'Failed to update page' });
  }
}

async function remove(req, res) {
  try {
    await deletePage(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error('Delete page error:', err);
    res.status(500).json({ message: 'Failed to delete page' });
  }
}

async function publish(req, res) {
  try {
    const updated = await publishPage(req.params.id, req.user && req.user.id);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('Publish page error:', err);
    res.status(500).json({ message: 'Failed to publish page' });
  }
}

async function unpublish(req, res) {
  try {
    const updated = await unpublishPage(req.params.id, req.user && req.user.id);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('Unpublish page error:', err);
    res.status(500).json({ message: 'Failed to unpublish page' });
  }
}

async function schedule(req, res) {
  try {
    const { scheduledAt } = req.body;
    const dt = new Date(scheduledAt);
    if (isNaN(dt.getTime())) return res.status(400).json({ message: 'Invalid date' });
    const updated = await schedulePage(req.params.id, dt, req.user && req.user.id);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('Schedule page error:', err);
    res.status(500).json({ message: 'Failed to schedule page' });
  }
}

async function rollback(req, res) {
  try {
    const { versionIndex } = req.body;
    if (typeof versionIndex !== 'number') return res.status(400).json({ message: 'versionIndex (number) required' });
    const updated = await rollbackPage(req.params.id, versionIndex, req.user && req.user.id);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('Rollback page error:', err);
    res.status(500).json({ message: err.message || 'Failed to rollback page' });
  }
}

module.exports = { create, list, get, getBySlug, update, publish, unpublish, schedule, rollback, remove };
