const cron = require('node-cron');
const { listScheduledPagesToPublish, publishPage } = require('../modules/pages/page.service.simple');

// Starts background scheduled tasks and returns a handle with a `stop()` method.
module.exports = function startScheduler() {
  const tasks = [];

  // Run every minute
  const t = cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Find pages scheduled for publish
      const toPublish = await listScheduledPagesToPublish(now, 100);
      if (toPublish && toPublish.length) {
        console.log(`Scheduler: publishing ${toPublish.length} pages`);
        for (const p of toPublish) {
          try {
            await publishPage(p._id, null);
          } catch (err) {
            console.error('Scheduler publish error', err && err.message ? err.message : err);
          }
        }
      }
    } catch (err) {
      console.error('Scheduler error', err && err.message ? err.message : err);
    }
  });

  tasks.push(t);

  return {
    stop() {
      for (const task of tasks) {
        try {
          task.stop();
        } catch (e) {
          console.warn('Failed to stop scheduler task', e && e.message ? e.message : e);
        }
      }
    },
  };
};
