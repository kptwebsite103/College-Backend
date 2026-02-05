const mediaQueue = require('../queues/media.queue');
const searchQueue = require('../queues/search.queue');
const backupQueue = require('../queues/backup.queue');
const notificationQueue = require('../queues/notification.queue');
const { closeQueue } = require('../config/bull');

// Initialize queues and return a handle with a stop method
function startQueues() {
  console.log('Starting background job queues...');

  // Queues are already initialized when required, but we can add any additional setup here

  return {
    queues: {
      media: mediaQueue,
      search: searchQueue,
      backup: backupQueue,
      notification: notificationQueue,
    },
    stop: async () => {
      console.log('Stopping background job queues...');
      await Promise.all([
        closeQueue(mediaQueue),
        closeQueue(searchQueue),
        closeQueue(backupQueue),
        closeQueue(notificationQueue),
      ]);
    },
  };
}

module.exports = startQueues;