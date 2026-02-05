const request = require('supertest');
const app = require('../../app');

jest.mock('../../modules/departments/department.service', () => ({
  createDepartment: jest.fn(async (payload) => ({ _id: 'd1', ...payload })),
  listDepartments: jest.fn(async () => ([{ _id: 'd1', name: { en: 'Dept' }, slug: 'dept' }])),
  getDepartment: jest.fn(async () => ({ _id: 'd1', name: { en: 'Dept' }, slug: 'dept' })),
  updateDepartment: jest.fn(async () => ({ _id: 'd1' })),
  removeDepartment: jest.fn(async () => null),
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

describe('Departments', () => {
  test('POST /api/departments requires auth', async () => {
    const res = await request(app).post('/api/departments');
    expect(res.status).toBe(401);
  });

  test('POST /api/departments forbidden for non-admin', async () => {
    const User = require('../../modules/users/user.model');
    User.findById.mockImplementationOnce(async () => ({ _id: 'u1', username: 'user', firstName: 'User', lastName: 'Test', roles: ['user'] }));

    const res = await request(app)
      .post('/api/departments')
      .set('Authorization', 'Bearer token_user')
      .send({ name: { en: 'Dept' }, slug: 'dept' });

    expect(res.status).toBe(403);
  });

  test('POST /api/departments success for admin', async () => {
    const res = await request(app)
      .post('/api/departments')
      .set('Authorization', 'Bearer token_admin')
      .send({ name: { en: 'Dept' }, slug: 'dept' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
  });

  test('GET /api/departments list', async () => {
    const res = await request(app).get('/api/departments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});