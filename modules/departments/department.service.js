const Department = require('./department.model');
const User = require('../users/user.model');

async function createDepartment(payload) {
  const doc = new Department(payload);
  return doc.save();
}

async function listDepartments({ limit = 20, skip = 0, active, q } = {}) {
  const filter = {};
  if (typeof active === 'boolean') filter.active = active;
  if (q) filter['name.en'] = new RegExp(q, 'i');
  return Department.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).populate('faculty');
}

async function getDepartment(id) {
  return Department.findById(id).populate('faculty');
}

async function getDepartmentBySlug(slug) {
  return Department.findOne({ slug }).populate('faculty');
}

async function updateDepartment(id, payload) {
  return Department.findByIdAndUpdate(id, payload, { new: true });
}

async function getFaculty(departmentId) {
  return User.find({ roles: 'faculty', departmentId });
}

async function removeDepartment(id) {
  return Department.findByIdAndDelete(id);
}

module.exports = { createDepartment, listDepartments, getDepartment, getDepartmentBySlug, getFaculty, updateDepartment, removeDepartment };
