const User = require('./user.model');
const bcrypt = require('bcrypt');

async function createUser(payload) {
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 12);
  }
  const user = new User(payload);
  return user.save();
}

async function listUsers({ limit = 20, skip = 0, active, q } = {}) {
  const filter = {};
  if (typeof active === 'boolean') filter.isActive = active;
  if (q) filter.$or = [
    { email: new RegExp(q, 'i') },
    { firstName: new RegExp(q, 'i') },
    { lastName: new RegExp(q, 'i') }
  ];
  return User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

async function getUser(id) {
  return User.findById(id);
}

async function updateUser(id, payload) {
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 12);
  }
  return User.findByIdAndUpdate(id, payload, { new: true });
}

async function deleteUser(id) {
  return User.findByIdAndDelete(id);
}

module.exports = { createUser, listUsers, getUser, updateUser, deleteUser };