require('dotenv').config({ path: './College-Backend/.env' });
const mongoose = require('mongoose');

// Define the Menu schema to match the backend
const MenuItemSchema = new mongoose.Schema({
  title: { type: Object, required: true },
  url: { type: String },
  order: { type: Number, default: 0 },
  target: { type: String, enum: ['_self', '_blank'], default: '_self' },
  status: { type: String, enum: ['Created', 'Approved'], default: 'Created' },
  items: [{ type: mongoose.Schema.Types.Mixed }]
});

const MenuSchema = new mongoose.Schema({
  name: { type: Object, required: true },
  slug: { type: String, required: true, index: true, unique: true },
  type: { type: String, enum: ['header', 'footer', 'navigation'], default: 'navigation' },
  url: { type: String },
  items: [MenuItemSchema],
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  departmentId: { type: String },
}, { timestamps: true });

const Menu = mongoose.model('Menu', MenuSchema);

async function checkMenuStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n=== MENU STATUS CHECK ===');
    console.log('Connected to database');
    
    const menus = await Menu.find({}).lean();
    
    console.log(`\nFound ${menus.length} menus in database:`);
    
    menus.forEach((menu, index) => {
      console.log(`\n${index + 1}. Menu: "${menu.name?.en || menu.slug}" (Active: ${menu.active})`);
      
      if (menu.items && menu.items.length > 0) {
        console.log(`   Items: ${menu.items.length}`);
        menu.items.forEach((item, itemIndex) => {
          console.log(`   ${itemIndex + 1}. "${item.title?.en || 'Untitled'}" - Status: "${item.status}" - Order: ${item.order}`);
          
          // Check nested items
          if (item.items && item.items.length > 0) {
            item.items.forEach((nestedItem, nestedIndex) => {
              console.log(`      ${nestedIndex + 1}. "${nestedItem.title?.en || 'Untitled'}" - Status: "${nestedItem.status}" - Order: ${nestedItem.order}`);
            });
          }
        });
      } else {
        console.log('   No items');
      }
    });
    
    // Count by status
    let createdCount = 0;
    let approvedCount = 0;
    let otherStatus = [];
    
    const countByStatus = (items) => {
      if (!items || !Array.isArray(items)) return;
      
      items.forEach(item => {
        if (item.status === 'Created') {
          createdCount++;
        } else if (item.status === 'Approved') {
          approvedCount++;
        } else {
          otherStatus.push(item.status);
        }
        
        // Recursively count nested items
        if (item.items && Array.isArray(item.items)) {
          countByStatus(item.items);
        }
      });
    };
    
    menus.forEach(menu => {
      if (menu.items && Array.isArray(menu.items)) {
        countByStatus(menu.items);
      }
    });
    
    console.log('\n=== STATUS SUMMARY ===');
    console.log(`Created: ${createdCount}`);
    console.log(`Approved: ${approvedCount}`);
    if (otherStatus.length > 0) {
      console.log(`Other statuses: ${[...new Set(otherStatus)].join(', ')}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkMenuStatus();
