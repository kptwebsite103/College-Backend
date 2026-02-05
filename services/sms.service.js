const axios = require('axios');

// Send SMS using external gateway (e.g., Twilio, AWS SNS)
async function sendSMS(to, message, opts = {}) {
  const apiKey = process.env.SMS_API_KEY;
  const apiUrl = process.env.SMS_API_URL || 'https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json';
  const from = opts.from || process.env.SMS_FROM;

  if (!apiKey || !from) throw new Error('SMS_API_KEY or SMS_FROM not configured');

  const payload = {
    To: to,
    From: from,
    Body: message,
  };

  try {
    const response = await axios.post(apiUrl, new URLSearchParams(payload), {
      auth: {
        username: process.env.SMS_ACCOUNT_SID || '',
        password: apiKey,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return { success: true, sid: response.data.sid };
  } catch (err) {
    console.error('Error sending SMS', err.response?.data || err.message);
    throw new Error('Failed to send SMS');
  }
}

// Send bulk SMS
async function sendBulkSMS(messages) {
  // messages: array of { to, message }
  const promises = messages.map(msg => sendSMS(msg.to, msg.message));
  return Promise.allSettled(promises);
}

module.exports = {
  sendSMS,
  sendBulkSMS,
};