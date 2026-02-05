const request = require('supertest');
const app = require('../../app');

jest.mock('../../modules/pages/page.service', () => ({
  createPage: jest.fn(async (data) => ({ _id: 'p1', ...data })),
  publishPage: jest.fn(async (id) => ({ _id: id, status: 'published' })),
  unpublishPage: jest.fn(async (id) => ({ _id: id, status: 'draft' })),
  schedulePage: jest.fn(async (id, dt) => ({ _id: id, scheduledAt: dt })),
  rollbackPage: jest.fn(async (id, idx) => ({ _id: id, rolledTo: idx })),
}));

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

const { createPage, publishPage, unpublishPage, schedulePage, rollbackPage } = require('../../modules/pages/page.service');

describe('Pages features', () => {
  const newPage = { title: { en: 'Test', kn: '' }, slug: 'test', content: { en: 'body', kn: '' } };

  test('admin can create and get 201', async () => {
    const res = await request(app).post('/api/pages').set('Authorization', 'Bearer token_admin').send(newPage);
    expect(res.status).toBe(201);
    expect(createPage).toHaveBeenCalled();
  });

  test('admin can publish', async () => {
    const res = await request(app).post('/api/pages/p1/publish').set('Authorization', 'Bearer token_admin');
    expect(res.status).toBe(200);
    expect(publishPage).toHaveBeenCalledWith('p1', 'user_admin');
  });

  test('admin can unpublish', async () => {
    const res = await request(app).post('/api/pages/p1/unpublish').set('Authorization', 'Bearer token_admin');
    expect(res.status).toBe(200);
    expect(unpublishPage).toHaveBeenCalledWith('p1', 'user_admin');
  });

  test('admin can schedule', async () => {
    const dt = new Date().toISOString();
    const res = await request(app).post('/api/pages/p1/schedule').set('Authorization', 'Bearer token_admin').send({ scheduledAt: dt });
    expect(res.status).toBe(200);
    expect(schedulePage).toHaveBeenCalled();
  });

  test('admin can rollback', async () => {
    const res = await request(app).post('/api/pages/p1/rollback').set('Authorization', 'Bearer token_admin').send({ versionIndex: 0 });
    expect(res.status).toBe(200);
    expect(rollbackPage).toHaveBeenCalledWith('p1', 0, 'user_admin');
  });
});
