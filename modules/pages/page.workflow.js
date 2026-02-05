const { updatePage } = require('./page.service');

async function submitForReview(pageId, updatedBy) {
  // Change status from draft to review
  return updatePage(pageId, { status: 'review', updatedBy });
}

async function approvePage(pageId, updatedBy) {
  // Change status from review to published
  return updatePage(pageId, { status: 'published', publishedAt: new Date(), updatedBy });
}

async function rejectPage(pageId, updatedBy) {
  // Change status back to draft
  return updatePage(pageId, { status: 'draft', updatedBy });
}

async function archivePage(pageId, updatedBy) {
  // Archive the page
  return updatePage(pageId, { status: 'archived', updatedBy });
}

module.exports = { submitForReview, approvePage, rejectPage, archivePage };