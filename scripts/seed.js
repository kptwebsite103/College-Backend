const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const Menu = require('../modules/menu/menu.model');
const User = require('../modules/users/user.model');

async function seedUsers() {
  try {
    console.log('Seeding users...');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists, skipping user seed...');
      return;
    }

    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('AdminPass123', 12);

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin'],
      isActive: true
    });

    await adminUser.save();
    console.log('✓ Admin user created (username: admin, password: AdminPass123)');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

async function seedMenus() {
  try {
    console.log('Seeding menus...');

    // Check if menus already exist
    const existingMenus = await Menu.countDocuments();
    if (existingMenus > 0) {
      console.log('Menus already exist, skipping seed...');
      return;
    }

    // Header Menu
    const headerMenu = new Menu({
      name: { en: 'Header Menu', kn: 'ಹೆಡರ್ ಮೆನು' },
      slug: 'header-menu',
      type: 'header',
      items: [
        {
          title: { en: 'Home', kn: 'ಮುಖ್ಯ ಪುಟ' },
          url: '/',
          order: 1,
          target: '_self'
        },
        {
          title: { en: 'About', kn: 'ನಮ್ಮ ಬಗ್ಗೆ' },
          url: '/about',
          order: 2,
          target: '_self'
        },
        {
          title: { en: 'Services', kn: 'ಸೇವೆಗಳು' },
          url: '/services',
          order: 3,
          target: '_self'
        },
        {
          title: { en: 'Contact', kn: 'ಸಂಪರ್ಕ' },
          url: '/contact',
          order: 4,
          target: '_self'
        }
      ],
      active: true,
      order: 1
    });

    // Footer Menu
    const footerMenu = new Menu({
      name: { en: 'Footer Menu', kn: 'ಫೂಟರ್ ಮೆನು' },
      slug: 'footer-menu',
      type: 'footer',
      items: [
        {
          title: { en: 'Privacy Policy', kn: 'ಗೌಪ್ಯತೆ ನೀತಿ' },
          url: '/privacy',
          order: 1,
          target: '_self'
        },
        {
          title: { en: 'Terms of Service', kn: 'ಸೇವಾ ನಿಯಮಗಳು' },
          url: '/terms',
          order: 2,
          target: '_self'
        },
        {
          title: { en: 'FAQ', kn: 'ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳು' },
          url: '/faq',
          order: 3,
          target: '_self'
        },
        {
          title: { en: 'Support', kn: 'ಬೆಂಬಲ' },
          url: '/support',
          order: 4,
          target: '_self'
        }
      ],
      active: true,
      order: 2
    });

    await headerMenu.save();
    await footerMenu.save();

    console.log('Menus seeded successfully!');
  } catch (error) {
    console.error('Error seeding menus:', error);
  }
}

async function runSeed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kpt-website');
    console.log('Connected to MongoDB');

    await seedUsers();
    await seedMenus();

    console.log('Seeding completed!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  runSeed();
}

module.exports = { seedMenus, runSeed };