const HomeSection = require('./homeSection.model');

async function createHomeSection(payload) {
  const doc = new HomeSection(payload);
  return doc.save();
}

async function listHomeSections({ limit = 20, skip = 0, q, active, type, departmentId } = {}) {
  const filter = {};
  if (typeof active === 'boolean') filter.active = active;
  if (type) filter.type = type;
  if (departmentId) filter.departmentId = departmentId;
  if (q) filter['title.en'] = new RegExp(q, 'i');

  return HomeSection.find(filter)
    .sort({ order: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

async function getHomeSection(id) {
  return HomeSection.findById(id).lean();
}

async function updateHomeSection(id, payload) {
  return HomeSection.findByIdAndUpdate(id, payload, { new: true }).lean();
}

async function removeHomeSection(id) {
  return HomeSection.findByIdAndDelete(id);
}

async function getActiveHomeSections(departmentId) {
  const filter = { active: true };
  if (departmentId) filter.departmentId = departmentId;

  return HomeSection.find(filter)
    .sort({ order: 1, type: 1 })
    .lean();
}

module.exports = {
  createHomeSection,
  listHomeSections,
  getHomeSection,
  updateHomeSection,
  removeHomeSection,
  getActiveHomeSections
};