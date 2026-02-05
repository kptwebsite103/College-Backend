const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../modules/users/user.model');
require('dotenv').config();

async function recreateAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kpt-website');
    console.log('Connected to MongoDB');

    // Remove existing admin user
    const deleteResult = await User.deleteOne({ username: 'admin' });
    if (deleteResult.deletedCount > 0) {
      console.log('✓ Existing admin user removed');
    } else {
      console.log('No existing admin user found');
    }

    // Hash password for new admin user
    const hashedPassword = await bcrypt.hash('AdminPass123', 12);

    // Create new admin user
    const adminUser = new User({
      username: 'admin',
      email: 'tusharkulal7@gmail.com',
      password: hashedPassword,
      roles: ['admin'],
      isActive: true
    });

    await adminUser.save();
    console.log('✓ New admin user created successfully');
    console.log('  Username: admin');
    console.log('  Email: tusharkulal7@gmail.com');
    console.log('  Password: AdminPass123');
    console.log('  Roles: admin');
  } catch (error) {
    console.error('Error recreating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  recreateAdmin();
}

module.exports = { recreateAdmin };