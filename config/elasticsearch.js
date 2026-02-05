const { Client } = require('@elastic/elasticsearch');

// Elastic client factory - keeps configuration in one place (no business logic)
function createClient(opts = {}) {
  const node = process.env.ELASTICSEARCH_URL || process.env.ELASTIC_URL;
  if (!node) {
    console.warn('ELASTICSEARCH_URL not set — Elasticsearch client will not be connected');
  }

  const client = new Client({ node, ...opts });
  return client;
}

// default exported client (lazy created)
let _client;
function getClient() {
  if (!_client) _client = createClient();
  return _client;
}

// Helper: index name prefix and builder
function getIndexPrefix() {
  return (process.env.ELASTICSEARCH_INDEX_PREFIX || process.env.ELASTIC_INDEX_PREFIX || 'kpt').toLowerCase();
}

function indexNameFor(type) {
  if (!type) throw new Error('index type is required');
  const prefix = getIndexPrefix();
  return `${prefix}-${String(type).toLowerCase()}`;
}

// Default index settings — small and sensible defaults
function defaultIndexSettings() {
  const shards = Number(process.env.ELASTICSEARCH_SHARDS || 1);
  const replicas = Number(process.env.ELASTICSEARCH_REPLICAS || 1);
  return {
    settings: {
      index: {
        number_of_shards: shards,
        number_of_replicas: replicas,
      },
    },
  };
}

// Ensure an index exists with optional mappings/settings
async function createIndexIfNotExists(index, opts = {}) {
  const client = getClient();
  try {
    const exists = await client.indices.exists({ index });
    if (exists && exists.statusCode === 200) return true;

    const body = { ...(opts.settings ? { settings: opts.settings } : defaultIndexSettings()) };
    if (opts.mappings) body.mappings = opts.mappings;

    await client.indices.create({ index, body });
    return true;
  } catch (err) {
    console.error('Error creating index', index, err && err.message ? err.message : err);
    throw err;
  }
}

// Index a single document
async function indexDocument(index, id, doc, opts = {}) {
  const client = getClient();
  try {
    const params = { index, id, body: doc, refresh: opts.refresh || false };
    return await client.index(params);
  } catch (err) {
    console.error('Error indexing document', index, id, err && err.message ? err.message : err);
    throw err;
  }
}

// Delete a single document
async function deleteDocument(index, id) {
  const client = getClient();
  try {
    return await client.delete({ index, id });
  } catch (err) {
    // If not found, return gracefully
    if (err && err.meta && err.meta.statusCode === 404) return null;
    console.error('Error deleting document', index, id, err && err.message ? err.message : err);
    throw err;
  }
}

// Bulk index operations: actions is an array of objects { action: 'index'|'delete', index, id, body }
async function bulkIndex(actions = []) {
  if (!Array.isArray(actions)) throw new Error('actions must be an array');
  const client = getClient();
  const body = [];
  for (const a of actions) {
    if (a.action === 'delete') {
      body.push({ delete: { _index: a.index, _id: a.id } });
    } else {
      body.push({ index: { _index: a.index, _id: a.id } });
      body.push(a.body || {});
    }
  }

  try {
    const res = await client.bulk({ refresh: true, body });
    if (res.errors) {
      console.error('Bulk indexing reported errors', res.items);
      throw new Error('Bulk indexing errors');
    }
    return res;
  } catch (err) {
    console.error('Bulk indexing failed', err && err.message ? err.message : err);
    throw err;
  }
}

module.exports = {
  createClient,
  getClient,
  getIndexPrefix,
  indexNameFor,
  defaultIndexSettings,
  createIndexIfNotExists,
  indexDocument,
  deleteDocument,
  bulkIndex,
};
