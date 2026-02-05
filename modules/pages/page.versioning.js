const Page = require('./page.model');

async function getPageVersions(pageId) {
  const page = await Page.findById(pageId).select('versions').lean();
  if (!page) throw new Error('Page not found');
  return page.versions || [];
}

async function getVersionByIndex(pageId, index) {
  const versions = await getPageVersions(pageId);
  if (index < 0 || index >= versions.length) throw new Error('Version index out of range');
  return versions[index];
}

async function getVersionHistory(pageId) {
  const page = await Page.findById(pageId).select('versions createdAt updatedAt').lean();
  if (!page) throw new Error('Page not found');
  return {
    current: { createdAt: page.createdAt, updatedAt: page.updatedAt },
    versions: page.versions
  };
}

async function compareVersions(pageId, index1, index2) {
  const versions = await getPageVersions(pageId);
  if (index1 < 0 || index1 >= versions.length || index2 < 0 || index2 >= versions.length) {
    throw new Error('Version index out of range');
  }
  const v1 = versions[index1];
  const v2 = versions[index2];
  // Simple diff: return both
  return { version1: v1, version2: v2 };
}

module.exports = { getPageVersions, getVersionByIndex, getVersionHistory, compareVersions };