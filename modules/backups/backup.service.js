const Backup = require('./backup.model');

async function createBackup(payload) {
  const doc = new Backup(payload);
  const savedBackup = await doc.save();

  // Enqueue backup processing job
  const backupQueue = require('../../queues/backup.queue');
  await backupQueue.add({ backupId: savedBackup._id, type: payload.type || 'database' });

  return savedBackup;
}

async function listBackups({ limit = 20, skip = 0, status } = {}) {
  const filter = {};
  if (status) filter.status = status;
  return Backup.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

async function getBackup(id) {
  return Backup.findById(id);
}

async function updateBackup(id, payload) {
  return Backup.findByIdAndUpdate(id, payload, { new: true });
}

module.exports = { createBackup, listBackups, getBackup, updateBackup };