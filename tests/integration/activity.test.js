const request = require('supertest');
const app = require('../../app');

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, secret, opts, cb) => {
    if (typeof opts === 'function') cb = opts;
    const map = { 'token_admin': { userId: 'user_admin', roles: ['admin'] } };
    const payload = map[token] || null;
    if (!payload) return cb(new Error('invalid token'));
    cb(null, payload);
  }),
}));

jest.mock('../../modules/users/user.model', () => ({
  findById: jest.fn(async (id) => ({ _id: 'user_admin', username: 'admin', firstName: 'Admin', lastName: 'User', roles: ['admin'] })),
  findOne: jest.fn(async (query) => null),
}));

const activityService = require('../../modules/activity-log/activity.service');
jest.spyOn(activityService, 'createActivity').mockResolvedValue({});

// Mock some page service functions to trigger logging
jest.mock('../../modules/pages/page.service', () => ({
  createPage: jest.fn(async (data) => ({ _id: 'p1', ...data })),
  publishPage: jest.fn(async (id) => ({ _id: id, status: 'published' })),
}));

// ensure mocked page.service implementations call activityService to simulate real behavior
const pageService = require('../../modules/pages/page.service');
pageService.createPage.mockImplementation(async (data) => {
  const saved = { _id: 'p1', ...data };
  await activityService.createActivity({ action: 'create', resourceType: 'page', resourceId: 'p1', after: saved });
  return saved;
});
pageService.publishPage.mockImplementation(async (id) => {
  const doc = { _id: id, status: 'published' };
  await activityService.createActivity({ action: 'publish', resourceType: 'page', resourceId: id, after: doc });
  return doc;
});

describe('Activity logging', () => {
  test('create page logs activity', async () => {
    const p = { title: { en: 'T', kn: '' }, slug: 't', content: { en: 'b', kn: '' } };
    const res = await request(app).post('/api/pages').set('Authorization', 'Bearer token_admin').send(p);
    expect(res.status).toBe(201);
    expect(activityService.createActivity).toHaveBeenCalledWith(expect.objectContaining({ action: 'create', resourceType: 'page' }));
  });

  test('publish page logs activity', async () => {
    const res = await request(app).post('/api/pages/p1/publish').set('Authorization', 'Bearer token_admin');
    expect(res.status).toBe(200);
    expect(activityService.createActivity).toHaveBeenCalledWith(expect.objectContaining({ action: 'publish', resourceType: 'page' }));
  });
});
