const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections found:');
    collections.forEach(col => console.log(`  - ${col.name}`));

    // Check users
    const User = require('./modules/users/user.model');
    const userCount = await User.countDocuments();
    console.log(`\n👥 Users: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find().limit(3);
      console.log('Sample users:');
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.roles.join(', ')})`);
      });
    }

    // Check menus (using the current model)
    try {
      const Menu = require('./modules/menu/menu.model');
      const menuCount = await Menu.countDocuments();
      console.log(`\n🍽️  Menus: ${menuCount}`);
      
      if (menuCount > 0) {
        const menus = await Menu.find().limit(3);
        console.log('Sample menus:');
        menus.forEach(menu => {
          console.log(`  - ${menu.name?.en || 'No name'} (${menu.items?.length || 0} items)`);
        });
      }
    } catch (err) {
      console.log('\n❌ Menu model not found or error:', err.message);
    }

    // Check if there's a different menu structure
    try {
      const collections = await db.listCollections().toArray();
      const menuCollections = collections.filter(c => c.name.toLowerCase().includes('menu'));
      if (menuCollections.length > 0) {
        console.log('\n🔍 Menu-related collections:');
        for (const col of menuCollections) {
          const count = await db.collection(col.name).countDocuments();
          console.log(`  - ${col.name}: ${count} documents`);
        }
      }
    } catch (err) {
      console.log('Error checking menu collections:', err.message);
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDatabase();
