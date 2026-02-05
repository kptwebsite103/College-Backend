const axios = require('axios');

// Send email using external service (e.g., SendGrid, Mailgun)
async function sendEmail(to, subject, html, text = '', opts = {}) {
  const apiKey = process.env.EMAIL_API_KEY;
  const apiUrl = process.env.EMAIL_API_URL || 'https://api.sendgrid.com/v3/mail/send';
  const from = opts.from || process.env.EMAIL_FROM || 'noreply@example.com';

  if (!apiKey) throw new Error('EMAIL_API_KEY not configured');

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject,
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html },
    ],
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    return { success: true, messageId: response.headers['x-message-id'] };
  } catch (err) {
    console.error('Error sending email', err.response?.data || err.message);
    throw new Error('Failed to send email');
  }
}

// Send bulk emails
async function sendBulkEmails(emails) {
  // emails: array of { to, subject, html, text }
  const promises = emails.map(email => sendEmail(email.to, email.subject, email.html, email.text));
  return Promise.allSettled(promises);
}

module.exports = {
  sendEmail,
  sendBulkEmails,
};