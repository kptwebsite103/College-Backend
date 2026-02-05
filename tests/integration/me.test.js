const request = require('supertest');
const app = require('../../app');

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, secret, opts, cb) => {
    // allow optional opts param
    if (typeof opts === 'function') cb = opts;
    // Simulate successful verification with userId
    cb(null, { userId: 'user_123', roles: ['admin'] });
  }),
}));

jest.mock('../../modules/users/user.model', () => ({
  findById: jest.fn(async (id) => ({
    _id: 'user_123',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['admin'],
  })),
  findOne: jest.fn(async (query) => null),
}));

describe('GET /api/me', () => {
  test('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });

  test('returns user object with valid token', async () => {
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer faketoken');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'user_123');
    expect(res.body).toHaveProperty('username', 'admin');
    expect(res.body).toHaveProperty('roles');
    expect(Array.isArray(res.body.roles)).toBe(true);
  });
});
