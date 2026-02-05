const { createQueue } = require('../config/bull');

const searchQueue = createQueue('search-indexing');

searchQueue.process(async (job) => {
  const { index, id, document, action } = job.data;

  console.log(`Processing search indexing job: ${action} for ${index}/${id}`);

  const { indexDocument, deleteDocument, bulkIndex } = require('../config/elasticsearch');

  switch (action) {
    case 'index':
      await indexDocument(index, id, document);
      break;

    case 'delete':
      await deleteDocument(index, id);
      break;

    case 'bulk':
      await bulkIndex(document); // document should be array of actions
      break;

    default:
      throw new Error(`Unknown search action: ${action}`);
  }

  console.log(`Search indexing completed for ${index}/${id}`);
});

module.exports = searchQueue;