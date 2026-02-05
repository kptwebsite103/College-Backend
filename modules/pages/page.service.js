const Page = require('./page.model');

const slugify = require('../../utils/slugify');

const activityService = require('../activity-log/activity.service');
const { emitPageUpdate } = require('../../sockets/analytics.socket');
const { createNotification } = require('../notifications/notification.service');

async function createPage(data) {
  // ensure slug
  if (!data.slug || !String(data.slug).trim()) data.slug = slugify(data.title && data.title.en ? data.title.en : 'page');

  // ensure uniqueness by appending suffix if needed
  let base = data.slug;
  let suffix = 0;
  while (await Page.findOne({ slug: data.slug })) {
    suffix += 1;
    data.slug = `${base}-${suffix}`;
  }

  const page = new Page(data);
  const saved = await page.save();

  // Index for search
  try {
    const searchQueue = require('../../queues/search.queue');
    await searchQueue.add({
      index: 'pages',
      id: saved._id.toString(),
      document: {
        title: saved.title,
        content: saved.content,
        slug: saved.slug,
        status: saved.status,
        createdAt: saved.createdAt,
      },
      action: 'index'
    });
  } catch (err) {
    console.error('Search indexing error (create):', err && err.message ? err.message : err);
  }

  // Log activity
  try {
    await activityService.createActivity({
      actorId: data.author || null,
      actorEmail: (data.authorEmail) || null,
      action: 'create',
      resourceType: 'page',
      resourceId: saved._id.toString(),
      before: null,
      after: saved,
      meta: {},
    });
  } catch (err) {
    console.error('Activity log error (create):', err && err.message ? err.message : err);
  }

  return saved;
}

async function getPageById(id) {
  return Page.findById(id).lean();
}

async function getPageBySlug(slug) {
  return Page.findOne({ slug, status: 'published' }).lean();
}

async function listPages(filter = {}, options = {}) {
  const query = Page.find(filter).sort({ createdAt: -1 });
  if (options.limit) query.limit(parseInt(options.limit, 10));
  if (options.skip) query.skip(parseInt(options.skip, 10));
  return query.lean();
}

async function updatePage(id, update, opts = {}) {
  const before = await Page.findById(id).lean();
  const doc = await Page.findOneAndUpdate({ _id: id }, update, { new: true });

  // Update search index
  try {
    const searchQueue = require('../../queues/search.queue');
    await searchQueue.add({
      index: 'pages',
      id: id,
      document: {
        title: doc.title,
        content: doc.content,
        slug: doc.slug,
        status: doc.status,
        createdAt: doc.createdAt,
      },
      action: 'index'
    });
  } catch (err) {
    console.error('Search indexing error (update):', err && err.message ? err.message : err);
  }

  // log activity
  try {
    await activityService.createActivity({
      actorId: update.updatedBy || null,
      action: 'update',
      resourceType: 'page',
      resourceId: id,
      before,
      after: doc,
      meta: {},
    });
  } catch (err) {
    console.error('Activity log error (update):', err && err.message ? err.message : err);
  }

  // Emit real-time page update
  try {
    emitPageUpdate(id, 'update', { before, after: doc, updatedBy: update.updatedBy });
  } catch (err) {
    console.error('Socket emit error (update):', err && err.message ? err.message : err);
  }

  // Create notification for page update
  try {
    if (doc.author && doc.author !== update.updatedBy) {
      await createNotification({
        userId: doc.author,
        type: 'page_update',
        title: 'Page Updated',
        message: `Your page "${doc.title?.en || doc.slug}" has been updated.`,
        data: { pageId: id, action: 'update' }
      });
    }
  } catch (err) {
    console.error('Notification create error (update):', err && err.message ? err.message : err);
  }

  return doc;
}

async function deletePage(id) {
  const before = await Page.findById(id).lean();
  await Page.deleteOne({ _id: id });

  // Remove from search index
  try {
    const searchQueue = require('../../queues/search.queue');
    await searchQueue.add({
      index: 'pages',
      id: id,
      action: 'delete'
    });
  } catch (err) {
    console.error('Search indexing error (delete):', err && err.message ? err.message : err);
  }

  try {
    await activityService.createActivity({
      actorId: null,
      action: 'delete',
      resourceType: 'page',
      resourceId: id,
      before,
      after: null,
      meta: {},
    });
  } catch (err) {
    console.error('Activity log error (delete):', err && err.message ? err.message : err);
  }

  // Emit real-time page update
  try {
    emitPageUpdate(id, 'delete', { before, after: null });
  } catch (err) {
    console.error('Socket emit error (delete):', err && err.message ? err.message : err);
  }

  return { deleted: 1 };
}

async function publishPage(id, updatedBy) {
  const before = await Page.findById(id).lean();
  const doc = await Page.findOneAndUpdate({ _id: id }, { status: 'published', publishedAt: new Date(), updatedBy }, { new: true });
  try {
    await activityService.createActivity({
      actorId: updatedBy || null,
      action: 'publish',
      resourceType: 'page',
      resourceId: id,
      before,
      after: doc,
      meta: {},
    });
  } catch (err) {
    console.error('Activity log error (publish):', err && err.message ? err.message : err);
  }

  // Emit real-time page update
  try {
    emitPageUpdate(id, 'publish', { before, after: doc, updatedBy });
  } catch (err) {
    console.error('Socket emit error (publish):', err && err.message ? err.message : err);
  }

  return doc;
}

async function unpublishPage(id, updatedBy) {
  const before = await Page.findById(id).lean();
  const doc = await Page.findOneAndUpdate({ _id: id }, { status: 'draft', publishedAt: null, updatedBy }, { new: true });
  try {
    await activityService.createActivity({
      actorId: updatedBy || null,
      action: 'unpublish',
      resourceType: 'page',
      resourceId: id,
      before,
      after: doc,
      meta: {},
    });
  } catch (err) {
    console.error('Activity log error (unpublish):', err && err.message ? err.message : err);
  }

  // Emit real-time page update
  try {
    emitPageUpdate(id, 'unpublish', { before, after: doc, updatedBy });
  } catch (err) {
    console.error('Socket emit error (unpublish):', err && err.message ? err.message : err);
  }

  return doc;
}

async function schedulePage(id, scheduledAt, updatedBy) {
  const before = await Page.findById(id).lean();
  const doc = await Page.findOneAndUpdate({ _id: id }, { scheduledAt, updatedBy }, { new: true });
  try {
    await activityService.createActivity({
      actorId: updatedBy || null,
      action: 'schedule',
      resourceType: 'page',
      resourceId: id,
      before,
      after: doc,
      meta: { scheduledAt },
    });
  } catch (err) {
    console.error('Activity log error (schedule):', err && err.message ? err.message : err);
  }
  return doc;
}

// Rollback to a version index (0-based, last pushed is latest) - will push current into versions
async function rollbackPage(id, versionIndex, updatedBy) {
  const doc = await Page.findById(id);
  if (!doc) throw new Error('Not found');
  if (!doc.versions || versionIndex < 0 || versionIndex >= doc.versions.length) throw new Error('Invalid version');

  const before = doc.toObject();
  const target = doc.versions[versionIndex];
  // push current as version
  const current = { title: doc.title, content: doc.content, updatedAt: new Date(), updatedBy };
  doc.versions.push(current);

  // restore
  doc.title = target.title;
  doc.content = target.content;
  doc.updatedAt = new Date();
  doc.updatedBy = updatedBy;

  await doc.save();

  try {
    await activityService.createActivity({
      actorId: updatedBy || null,
      action: 'rollback',
      resourceType: 'page',
      resourceId: id,
      before,
      after: doc,
      meta: { versionIndex },
    });
  } catch (err) {
    console.error('Activity log error (rollback):', err && err.message ? err.message : err);
  }

  return doc;
}

module.exports = { createPage, getPageById, listPages, updatePage, deletePage, publishPage, unpublishPage, schedulePage, rollbackPage };
