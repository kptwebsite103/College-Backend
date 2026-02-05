const request = require('supertest');
const app = require('../../app');
const path = require('path');

jest.mock('../../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload: jest.fn(async (filePath) => ({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg',
        public_id: 'sample',
        bytes: 12345,
        format: 'jpg',
        resource_type: 'image',
      })),
    },
    utils: {
      api_sign_request: jest.fn(() => 'sig123'),
    },
  },
  configure: jest.fn(),
}));

jest.mock('../../modules/media/media.service', () => ({
  createMediaFromUpload: jest.fn(async ({ filePath, filename }) => ({ _id: 'm1', url: 'https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg', filename })),
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

describe('Media upload', () => {
  test('POST /api/media/upload requires auth', async () => {
    const res = await request(app).post('/api/media/upload');
    expect(res.status).toBe(401);
  });

  test('POST /api/media/upload success', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', 'Bearer token_admin')
      .attach('file', path.resolve(__dirname, '../fixtures/sample.jpg'));

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
  });

  test('POST /api/media/upload forbidden for non-editor/admin', async () => {
    // Override user mock to return a 'user' role
    const User = require('../../modules/users/user.model');
    User.findById.mockImplementationOnce(async () => ({ _id: 'user_1', username: 'user', firstName: 'User', lastName: 'Test', roles: ['user'] }));

    // Don't attach file to avoid request stream reset when server rejects early
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', 'Bearer token_user');

    expect(res.status).toBe(403);
  });

  test('POST /api/media/sign requires auth', async () => {
    const res = await request(app).post('/api/media/sign');
    expect(res.status).toBe(401);
  });

  test('POST /api/media/sign success for admin/editor', async () => {
    const res = await request(app)
      .post('/api/media/sign')
      .set('Authorization', 'Bearer token_admin')
      .send({ folder: 'pages', public_id: 'myfile' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('signature');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('apiKey');
  });
});
