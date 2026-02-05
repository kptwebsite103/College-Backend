const mongoose = require('mongoose');
const User = require('../modules/users/user.model');
require('dotenv').config();

async function updateAdminEmail() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kpt-website');
    console.log('Connected to MongoDB');

    // Find and update admin user
    const result = await User.updateOne(
      { username: 'admin' },
      { email: 'tusharkulal7@gmail.com' }
    );

    if (result.matchedCount > 0) {
      console.log('✓ Admin user email updated successfully');
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error updating admin email:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  updateAdminEmail();
}

module.exports = { updateAdminEmail };