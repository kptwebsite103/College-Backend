const mongoose = require('mongoose');
require('dotenv').config();

async function seedMenus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Create a custom menu collection that matches frontend structure
    const menuData = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Home',
        menu_name_en: 'Home',
        menu_name_kn: 'ಮುಖಪುಟ',
        url_en: '/home',
        url_kn: '/home',
        link: '/home',
        parent_id: 0,
        order_no: 1,
        status: 'Approved',
        slug: 'home',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'About',
        menu_name_en: 'About',
        menu_name_kn: 'ನಮ್ಮ ಬಗ್ಗೆ',
        url_en: '/about',
        url_kn: '/about',
        link: '/about',
        parent_id: 0,
        order_no: 2,
        status: 'Approved',
        slug: 'about',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Academics',
        menu_name_en: 'Academics',
        menu_name_kn: 'ಅಕಾಡೆಮಿಕ್ಸ್',
        url_en: '/academics',
        url_kn: '/academics',
        link: '/academics',
        parent_id: 0,
        order_no: 3,
        status: 'Approved',
        slug: 'academics',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Departments',
        menu_name_en: 'Departments',
        menu_name_kn: 'ವಿಭಾಗಗಳು',
        url_en: '/departments',
        url_kn: '/departments',
        link: '/departments',
        parent_id: 0,
        order_no: 4,
        status: 'Approved',
        slug: 'departments',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Admissions',
        menu_name_en: 'Admissions',
        menu_name_kn: 'ಪ್ರವೇಶಾತಿಗಳು',
        url_en: '/admissions',
        url_kn: '/admissions',
        link: '/admissions',
        parent_id: 0,
        order_no: 5,
        status: 'Approved',
        slug: 'admissions',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Contact',
        menu_name_en: 'Contact',
        menu_name_kn: 'ಸಂಪರ್ಕ',
        url_en: '/contact',
        url_kn: '/contact',
        link: '/contact',
        parent_id: 0,
        order_no: 6,
        status: 'Approved',
        slug: 'contact',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert into menus collection (clear existing first)
    await db.collection('menus').deleteMany({});
    const result = await db.collection('menus').insertMany(menuData);
    console.log(`✅ Added ${result.insertedCount} menu items`);

    // Verify the data
    const count = await db.collection('menus').countDocuments();
    console.log(`📊 Total menus in database: ${count}`);

    console.log('\n🎉 Menu data seeded successfully!');
    console.log('Your frontend should now show navbar items.');

  } catch (error) {
    console.error('❌ Error seeding menus:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seedMenus();
