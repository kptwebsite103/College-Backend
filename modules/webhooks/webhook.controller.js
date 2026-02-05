const { createWebhook, processWebhook } = require('./webhook.service');
const { webhookSchema } = require('./webhook.validation');

async function receiveWebhook(req, res) {
  try {
    const { error, value } = webhookSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    // Store the webhook
    const webhook = await createWebhook(value, req.headers);

    // Process the webhook asynchronously (in a real app, use a queue)
    setImmediate(() => {
      processWebhook(webhook._id).catch(err => console.error('Webhook processing error:', err));
    });

    // Respond immediately
    res.status(200).json({ message: 'Webhook received', id: webhook._id });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function listWebhooks(req, res) {
  try {
    const { limit, skip, source, processed } = req.query;
    const webhooks = await require('./webhook.service').listWebhooks({
      limit: parseInt(limit) || 20,
      skip: parseInt(skip) || 0,
      source,
      processed: processed === 'true' ? true : processed === 'false' ? false : undefined,
    });
    res.json(webhooks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getWebhook(req, res) {
  try {
    const webhook = await require('./webhook.service').getWebhook(req.params.id);
    if (!webhook) return res.status(404).json({ message: 'Webhook not found' });
    res.json(webhook);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { receiveWebhook, listWebhooks, getWebhook };