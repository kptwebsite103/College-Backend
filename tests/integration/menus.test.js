const request = require('supertest');
const app = require('../../app');

jest.mock('../../modules/menu/menu.service', () => ({
  createMenu: jest.fn(async (payload) => ({ _id: 'm1', ...payload })),
  listMenus: jest.fn(async () => ([{ _id: 'm1', name: { en: 'Main' }, slug: 'main' }])),
  getMenu: jest.fn(async () => ({ _id: 'm1', name: { en: 'Main' }, slug: 'main' })),
  updateMenu: jest.fn(async () => ({ _id: 'm1' })),
  removeMenu: jest.fn(async () => null),
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, secret, opts, cb) => {
    if (typeof opts === 'function') cb = opts;
    cb(null, { userId: 'user_admin', roles: ['admin'] });
  }),
}));

jest.mock('../../modules/users/user.model', () => ({
  findById: jest.fn(async (id) => ({ _id: 'user_admin', username: 'admin', firstName: 'Admin', lastName: 'User', roles: ['admin'] })),
  findOne: jest.fn(async (query) => null),
}));

describe('Menus', () => {
  test('POST /api/menus requires auth', async () => {
    const res = await request(app).post('/api/menus');
    expect(res.status).toBe(401);
  });

  test('POST /api/menus forbidden for non-admin', async () => {
    const User = require('../../modules/users/user.model');
    User.findById.mockImplementationOnce(async () => ({ _id: 'u1', username: 'user', firstName: 'User', lastName: 'Test', roles: ['user'] }));

    const res = await request(app)
      .post('/api/menus')
      .set('Authorization', 'Bearer token_user')
      .send({ name: { en: 'Main' }, slug: 'main' });

    expect(res.status).toBe(403);
  });

  test('POST /api/menus success for admin', async () => {
    const res = await request(app)
      .post('/api/menus')
      .set('Authorization', 'Bearer token_admin')
      .send({ name: { en: 'Main' }, slug: 'main' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
  });

  test('POST /api/menus slug conflict returns 409', async () => {
    const menus = require('../../modules/menu/menu.service');
    menus.createMenu.mockImplementationOnce(() => {
      const err = new Error('Slug already exists');
      err.status = 409;
      throw err;
    });

    const res = await request(app)
      .post('/api/menus')
      .set('Authorization', 'Bearer token_admin')
      .send({ name: { en: 'Other' }, slug: 'main' });

    expect(res.status).toBe(409);
  });

  test('GET /api/menus list', async () => {
    const res = await request(app).get('/api/menus');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});