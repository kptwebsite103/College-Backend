const axios = require('axios');

// Send push notification using FCM
async function sendPushNotification(token, title, body, data = {}) {
  const serverKey = process.env.FCM_SERVER_KEY;
  const apiUrl = 'https://fcm.googleapis.com/fcm/send';

  if (!serverKey) throw new Error('FCM_SERVER_KEY not configured');

  const payload = {
    to: token,
    notification: {
      title,
      body,
    },
    data,
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `key=${serverKey}`,
        'Content-Type': 'application/json',
      },
    });
    return { success: true, messageId: response.data.multicast_id };
  } catch (err) {
    console.error('Error sending push notification', err.response?.data || err.message);
    throw new Error('Failed to send push notification');
  }
}

// Send to multiple tokens
async function sendBulkPushNotifications(notifications) {
  // notifications: array of { token, title, body, data }
  const promises = notifications.map(n => sendPushNotification(n.token, n.title, n.body, n.data));
  return Promise.allSettled(promises);
}

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
};