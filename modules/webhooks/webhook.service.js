const Webhook = require('./webhook.model');
const { createWorkflowInstance } = require('../workflows/workflow.service');

async function createWebhook(payload, headers) {
  const doc = new Webhook({
    source: payload.source,
    event: payload.event,
    payload: payload.payload,
    headers,
  });
  return doc.save();
}

async function processWebhook(id) {
  const webhook = await Webhook.findById(id);
  if (!webhook || webhook.processed) return;

  try {
    // Process based on source and event
    if (webhook.source === 'payment' && webhook.event === 'payment.succeeded') {
      // Trigger payment success workflow
      // Assume there's a workflow for payment processing
      // For now, just log
      console.log('Processing payment success:', webhook.payload);
    } else if (webhook.source === 'cms' && webhook.event === 'content.updated') {
      // Trigger CMS sync workflow
      console.log('Processing CMS update:', webhook.payload);
    }

    // Mark as processed
    webhook.processed = true;
    webhook.processedAt = new Date();
    await webhook.save();
  } catch (error) {
    webhook.error = error.message;
    await webhook.save();
    throw error;
  }
}

async function listWebhooks({ limit = 20, skip = 0, source, processed } = {}) {
  const filter = {};
  if (source) filter.source = source;
  if (typeof processed === 'boolean') filter.processed = processed;
  return Webhook.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

async function getWebhook(id) {
  return Webhook.findById(id);
}

module.exports = { createWebhook, processWebhook, listWebhooks, getWebhook };