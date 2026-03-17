require('dotenv').config({ path: __dirname + '/../.env' });
const { findUserByUsername, updateUser, createUser } = require('../modules/users/user.service');
const { disconnect } = require('../config/database');

async function run() {
  try {
    const existing = await findUserByUsername('admin');
    if (existing) {
      await updateUser(existing._id, {
        email: 'admin@admin.com',
        password: 'AdminPass123',
        roles: ['admin']
      });
      console.log('✓ Admin user updated successfully');
    } else {
      await createUser({
        username: 'admin',
        email: 'admin@admin.com',
        password: 'AdminPass123',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin']
      });
      console.log('✓ Admin user created successfully');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await disconnect();
  }
}

run();
