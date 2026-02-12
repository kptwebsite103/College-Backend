const Page = require('./page.model');
const slugify = require('../../utils/slugify');

// Simplified createPage without external dependencies
async function createPage(data) {
  try {
    // ensure slug
    if (!data.slug || !String(data.slug).trim()) {
      data.slug = slugify(data.title && data.title.en ? data.title.en : 'page');
    }

    // ensure uniqueness by appending suffix if needed
    let base = data.slug;
    let suffix = 0;
    while (await Page.findOne({ slug: data.slug })) {
      suffix += 1;
      data.slug = `${base}-${suffix}`;
    }

    const page = new Page(data);
    const saved = await page.save();
    
    console.log('Page saved successfully:', saved._id);
    return saved;
  } catch (error) {
    console.error('Error creating page:', error);
    throw error;
  }
}

// Simplified listPages without external dependencies
async function listPages(filter = {}, options = {}) {
  try {
    const query = Page.find(filter).sort({ createdAt: -1 });
    if (options.limit) query.limit(parseInt(options.limit, 10));
    if (options.skip) query.skip(parseInt(options.skip, 10));
    const pages = await query.lean();
    console.log('Found pages:', pages.length);
    return pages;
  } catch (error) {
    console.error('Error listing pages:', error);
    throw error;
  }
}

async function getPageById(id) {
  try {
    return Page.findById(id).lean();
  } catch (error) {
    console.error('Error getting page by id:', error);
    throw error;
  }
}

async function getPageBySlug(slug) {
  try {
    // Try both with and without leading slash
    const slugWithSlash = slug.startsWith('/') ? slug : `/${slug}`;
    const slugWithoutSlash = slug.startsWith('/') ? slug.slice(1) : slug;
    
    // First try with leading slash
    let page = await Page.findOne({ slug: slugWithSlash, status: 'approved' }).lean();
    if (page) return page;
    
    // Then try without leading slash
    page = await Page.findOne({ slug: slugWithoutSlash, status: 'approved' }).lean();
    return page;
  } catch (error) {
    console.error('Error getting page by slug:', error);
    throw error;
  }
}

async function updatePage(id, update) {
  try {
    const doc = await Page.findOneAndUpdate({ _id: id }, update, { new: true });
    console.log('Page updated successfully:', id);
    return doc;
  } catch (error) {
    console.error('Error updating page:', error);
    throw error;
  }
}

async function deletePage(id) {
  try {
    await Page.deleteOne({ _id: id });
    console.log('Page deleted successfully:', id);
    return { deleted: 1 };
  } catch (error) {
    console.error('Error deleting page:', error);
    throw error;
  }
}

// Placeholder functions for other operations
async function publishPage(id, updatedBy) {
  const doc = await updatePage(id, { status: 'approved', publishedAt: new Date(), updatedBy });
  return doc;
}

async function unpublishPage(id, updatedBy) {
  const doc = await updatePage(id, { status: 'draft', publishedAt: null, updatedBy });
  return doc;
}

async function rejectPage(id, updatedBy) {
  const doc = await updatePage(id, { status: 'rejected', updatedBy });
  return doc;
}

async function schedulePage(id, scheduledAt, updatedBy) {
  const doc = await updatePage(id, { scheduledAt, updatedBy });
  return doc;
}

async function rollbackPage(id, versionIndex, updatedBy) {
  throw new Error('Rollback not implemented in simplified version');
}

module.exports = { 
  createPage, 
  listPages, 
  getPageById, 
  getPageBySlug, 
  updatePage, 
  deletePage, 
  publishPage, 
  unpublishPage, 
  schedulePage, 
  rollbackPage,
  rejectPage 
};
