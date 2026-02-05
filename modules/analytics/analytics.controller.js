const { createAnalytics, listAnalytics, getAnalytics, getPageViewsReport, getUserActivityReport, getGeneralReport } = require('./analytics.service');
const { createSchema, listSchema, reportSchema } = require('./analytics.validation');

async function create(req, res) {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  const doc = await createAnalytics(value);
  res.status(201).json(doc);
}

async function list(req, res) {
  const { error, value } = listSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });
  const docs = await listAnalytics(value);
  res.json(docs);
}

async function getById(req, res) {
  const doc = await getAnalytics(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

async function getPageViews(req, res) {
  const { error, value } = reportSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });
  const report = await getPageViewsReport(value);
  res.json(report);
}

async function getUserActivity(req, res) {
  const { error, value } = reportSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });
  const report = await getUserActivityReport(value);
  res.json(report);
}

async function getGeneral(req, res) {
  const { error, value } = reportSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });
  const report = await getGeneralReport(value);
  res.json(report);
}

module.exports = { create, list, getById, getPageViews, getUserActivity, getGeneral };