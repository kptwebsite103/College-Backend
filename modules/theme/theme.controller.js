const { createTheme, getTheme, updateTheme, listThemes } = require('./theme.service');
const { createSchema, updateSchema } = require('./theme.validation');

async function create(req, res) {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const doc = await createTheme(value);
    res.status(201).json(doc);
  } catch (err) {
    console.error('Create theme error:', err);
    res.status(500).json({ message: 'Failed to create theme' });
  }
}

async function get(req, res) {
  const { type } = req.params;
  const doc = await getTheme(type);
  if (!doc) return res.status(404).json({ message: 'Theme not found' });
  res.json(doc);
}

async function update(req, res) {
  const { type } = req.params;
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const doc = await updateTheme(type, value);
    res.json(doc);
  } catch (err) {
    console.error('Update theme error:', err);
    res.status(500).json({ message: 'Failed to update theme' });
  }
}

async function list(req, res) {
  const docs = await listThemes();
  res.json(docs);
}

module.exports = { create, get, update, list };