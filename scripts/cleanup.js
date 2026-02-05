const mongoose = require('mongoose');
const Activity = require('../modules/activity-log/activity.model');
const Notification = require('../modules/notifications/notification.model');

// Cleanup older than 30 days
const CLEANUP_DAYS = 30;

async function cleanupActivities() {
  try {
    console.log('Cleaning up old activities...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);

    const result = await Activity.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    console.log(`Deleted ${result.deletedCount} old activities`);
  } catch (error) {
    console.error('Error cleaning up activities:', error);
  }
}

async function cleanupNotifications() {
  try {
    console.log('Cleaning up old notifications...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    console.log(`Deleted ${result.deletedCount} old notifications`);
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
}

async function cleanupTempFiles() {
  try {
    console.log('Cleaning up temporary files...');

    // Add logic to clean temp files if any
    // For now, placeholder
    console.log('No temporary files to clean');
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
}

async function runCleanup() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kpt-website');
    console.log('Connected to MongoDB');

    await cleanupActivities();
    await cleanupNotifications();
    await cleanupTempFiles();

    console.log('Cleanup completed!');
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  runCleanup();
}

module.exports = { cleanupActivities, cleanupNotifications, cleanupTempFiles, runCleanup };