const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./modules/users/user.model');
    const users = await User.find({}).select('username email roles');
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ${user.username} | ${user.email || 'NO EMAIL'} | Roles: ${user.roles.join(', ')}`);
    });
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
