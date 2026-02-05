const Notification = require('./notification.model');
const { emitNotification } = require('../../sockets/analytics.socket');

async function createNotification(payload) {
  const doc = new Notification(payload);
  const saved = await doc.save();
  // Emit real-time notification
  emitNotification(payload.userId, saved);
  return saved;
}

async function listNotifications(userId, { limit = 20, skip = 0, read } = {}) {
  const filter = { userId };
  if (typeof read === 'boolean') filter.read = read;
  return Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

async function markAsRead(id, userId) {
  return Notification.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });
}

async function getNotification(id, userId) {
  return Notification.findOne({ _id: id, userId });
}

async function sendExternalNotification({ type, recipients, data }) {
  // Create notification record
  const notification = new Notification({
    type,
    recipients,
    data,
    status: 'pending',
  });
  const saved = await notification.save();

  // Enqueue external notification job
  const notificationQueue = require('../../queues/notification.queue');
  await notificationQueue.add({
    notificationId: saved._id,
    type,
    recipients,
    data
  });

  return saved;
}

module.exports = { createNotification, listNotifications, markAsRead, getNotification, sendExternalNotification };