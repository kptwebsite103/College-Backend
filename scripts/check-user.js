const mongoose = require('mongoose');
const User = require('../modules/users/user.model');
require('dotenv').config();

async function checkUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    // Check if user exists
    const user = await User.findOne({
      $or: [
        { username: 'yashawant' },
        { email: 'yashawant@creator.com' }
      ]
    });

    if (user) {
      console.log('User found:', {
        _id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        isActive: user.isActive,
        createdAt: user.createdAt
      });
    } else {
      console.log('User not found');
    }

  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkUser();