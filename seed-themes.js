const mongoose = require('mongoose');
require('dotenv').config();

async function seedThemes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Create theme data for navbar
    const themeData = [
      {
        _id: new mongoose.Types.ObjectId(),
        type: 'navbar',
        colors: {
          color1: '#3b82f6', // Blue
          color2: '#14b8a6'  // Teal
        },
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert into themes collection (clear existing first)
    await db.collection('themes').deleteMany({});
    const result = await db.collection('themes').insertMany(themeData);
    console.log(`✅ Added ${result.insertedCount} theme items`);

    // Verify the data
    const count = await db.collection('themes').countDocuments();
    console.log(`📊 Total themes in database: ${count}`);

    console.log('\n🎉 Theme data seeded successfully!');
    console.log('Your navbar should now use colors from the database.');

  } catch (error) {
    console.error('❌ Error seeding themes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seedThemes();