const Theme = require('./theme.model');

async function createTheme(payload) {
  const doc = new Theme(payload);
  return doc.save();
}

async function getTheme(type) {
  return Theme.findOne({ type, active: true }).lean();
}

async function updateTheme(type, payload) {
  return Theme.findOneAndUpdate({ type }, payload, { new: true, upsert: true }).lean();
}

async function listThemes() {
  return Theme.find({ active: true }).lean();
}

module.exports = { createTheme, getTheme, updateTheme, listThemes };