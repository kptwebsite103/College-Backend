const request = require('supertest');
const app = require('../../app');

// Mock jwt.verify to map token values to user ids
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, secret, opts, cb) => {
    if (typeof opts === 'function') cb = opts;
    const map = {
      'token_user': { userId: 'user_user', roles: ['user'] },
      'token_admin': { userId: 'user_admin', roles: ['admin'] },
      'token_super': { userId: 'user_super', roles: ['superadmin'] },
    };
    const payload = map[token] || null;
    if (!payload) return cb(new Error('invalid token'));
    cb(null, payload);
  }),
}));

// Mock users to return users with different roles
jest.mock('../../modules/users/user.model', () => ({
  findById: jest.fn(async (id) => {
    const users = {
      'user_user': { _id: 'user_user', username: 'user', firstName: 'Normal', lastName: 'User', roles: ['user'] },
      'user_admin': { _id: 'user_admin', username: 'admin', firstName: 'Admin', lastName: 'User', roles: ['admin'] },
      'user_super': { _id: 'user_super', username: 'super', firstName: 'Super', lastName: 'Admin', roles: ['superadmin'] },
    };
    return users[id];
  }),
  findOne: jest.fn(async (query) => null),
}));

// Mock page.service so tests don't depend on DB
jest.mock('../../modules/pages/page.service', () => ({
  createPage: jest.fn(async (data) => ({ _id: 'page1', ...data })),
  updatePage: jest.fn(async (id, update) => ({ _id: id, ...update })),
  deletePage: jest.fn(async (id) => ({ deleted: 1 })),
}));

const { createPage, updatePage, deletePage } = require('../../modules/pages/page.service');

describe('Pages RBAC', () => {
  const newPage = { title: { en: 'Test', kn: '' }, slug: 'test', content: { en: 'body', kn: '' } };

  test('POST /api/pages - 401 without token', async () => {
    const res = await request(app).post('/api/pages').send(newPage);
    expect(res.status).toBe(401);
  });

  test('POST /api/pages - 403 for normal user', async () => {
    const res = await request(app).post('/api/pages').set('Authorization', 'Bearer token_user').send(newPage);
    expect(res.status).toBe(403);
  });

  test('POST /api/pages - 201 for admin', async () => {
    const res = await request(app).post('/api/pages').set('Authorization', 'Bearer token_admin').send(newPage);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(createPage).toHaveBeenCalled();
  });

  test('PUT /api/pages/:id - 403 for normal user', async () => {
    const res = await request(app).put('/api/pages/page1').set('Authorization', 'Bearer token_user').send({ title: { en: 'X', kn: '' } });
    expect(res.status).toBe(403);
  });

  test('PUT /api/pages/:id - 200 for admin', async () => {
    const res = await request(app).put('/api/pages/page1').set('Authorization', 'Bearer token_admin').send({ title: { en: 'X', kn: '' } });
    expect(res.status).toBe(200);
    expect(updatePage).toHaveBeenCalled();
  });

  test('DELETE /api/pages/:id - 403 for admin', async () => {
    const res = await request(app).delete('/api/pages/page1').set('Authorization', 'Bearer token_admin');
    expect(res.status).toBe(403);
  });

  test('DELETE /api/pages/:id - 204 for superadmin', async () => {
    const res = await request(app).delete('/api/pages/page1').set('Authorization', 'Bearer token_super');
    expect(res.status).toBe(204);
    expect(deletePage).toHaveBeenCalledWith('page1');
  });
});
