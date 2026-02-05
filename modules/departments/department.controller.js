const { createDepartment, listDepartments, getDepartment, getDepartmentBySlug, getFaculty: getFacultyService, updateDepartment, removeDepartment } = require('./department.service');
const { createSchema, updateSchema } = require('./department.validation');

async function create(req, res) {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  const doc = await createDepartment(value);
  res.status(201).json(doc);
}

async function list(req, res) {
  const { limit, skip, active, q } = req.query;
  const docs = await listDepartments({ limit: limit ? Number(limit) : undefined, skip: skip ? Number(skip) : undefined, active: active === 'true' ? true : active === 'false' ? false : undefined, q });
  res.json(docs);
}

async function getById(req, res) {
  const doc = await getDepartment(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

async function getBySlug(req, res) {
  const doc = await getDepartmentBySlug(req.params.slug);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

async function getFaculty(req, res) {
  const docs = await getFaculty(req.params.id);
  res.json(docs);
}

async function update(req, res) {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  const doc = await updateDepartment(req.params.id, value);
  res.json(doc);
}

async function remove(req, res) {
  await removeDepartment(req.params.id);
  res.status(204).end();
}

module.exports = { create, list, getById, getBySlug, getFaculty, update, remove };
