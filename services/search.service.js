const { getClient, indexNameFor } = require('../config/elasticsearch');

// Search documents in an index
async function searchDocuments(indexType, query, opts = {}) {
  const client = getClient();
  const index = indexNameFor(indexType);
  try {
    const params = {
      index,
      body: {
        query: query || { match_all: {} },
        size: opts.size || 20,
        from: opts.from || 0,
        sort: opts.sort || [{ _score: 'desc' }],
      },
    };
    if (opts.aggs) params.body.aggs = opts.aggs;
    const result = await client.search(params);
    return {
      hits: result.hits.hits.map(hit => ({ ...hit._source, _id: hit._id, _score: hit._score })),
      total: result.hits.total.value,
      aggregations: result.aggregations,
    };
  } catch (err) {
    console.error('Error searching documents', index, err.message);
    throw err;
  }
}

// Index a document (wrapper around config)
async function indexDocument(indexType, id, doc, opts = {}) {
  const { indexDocument: indexDoc } = require('../config/elasticsearch');
  return indexDoc(indexNameFor(indexType), id, doc, opts);
}

// Delete a document
async function deleteDocument(indexType, id) {
  const { deleteDocument: deleteDoc } = require('../config/elasticsearch');
  return deleteDoc(indexNameFor(indexType), id);
}

// Bulk operations
async function bulkIndex(actions) {
  const { bulkIndex: bulk } = require('../config/elasticsearch');
  return bulk(actions.map(a => ({ ...a, index: indexNameFor(a.indexType) })));
}

module.exports = {
  searchDocuments,
  indexDocument,
  deleteDocument,
  bulkIndex,
};