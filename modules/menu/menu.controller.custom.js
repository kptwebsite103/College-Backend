const mongoose = require('mongoose');
const { createMenu } = require('./menu.service');

// Helper function to convert string ID to ObjectId
function toObjectId(id) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    return id; // Return as-is if conversion fails
  }
}

async function list(req, res) {
  try {
    const db = mongoose.connection.db;
    const { limit, skip, status } = req.query;
    
    let filter = {};
    if (status) {
      filter.status = status;
    }
    
    const menus = await db.collection('menus')
      .find(filter)
      .sort({ order_no: 1 })
      .skip(skip ? parseInt(skip) : 0)
      .limit(limit ? parseInt(limit) : 50)
      .toArray();
    
    // Log all menu statuses for debugging
    console.log('📤 Backend list function - returning menus:');
    menus.forEach((menu, index) => {
      console.log(`  [${index}] ${menu.name?.en || 'Unnamed'} - status: ${menu.status}, active: ${menu.active}`);
    });
    
    res.json(menus);
  } catch (error) {
    console.error('List menus error:', error);
    res.status(500).json({ message: 'Failed to fetch menus' });
  }
}

async function getById(req, res) {
  try {
    const db = mongoose.connection.db;
    const menu = await db.collection('menus').findOne({ _id: toObjectId(req.params.id) });
    
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    
    res.json(menu);
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ message: 'Failed to fetch menu' });
  }
}

async function create(req, res) {
  try {
    console.log('📥 Creating menu with data:', JSON.stringify(req.body, null, 2));
    const menu = await createMenu(req.body);
    console.log('✅ Created menu:', JSON.stringify(menu, null, 2));
    res.status(201).json(menu);
  } catch (error) {
    console.error('❌ Create menu error:', error);
    res.status(500).json({ message: 'Failed to create menu', error: error.message });
  }
}

async function update(req, res) {
  try {
    const db = mongoose.connection.db;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    // Remove _id from updateData to avoid immutable field error
    delete updateData._id;

    console.log('🔄 Backend updating menu:', req.params.id);
    console.log('📥 Update data:', JSON.stringify(updateData, null, 2));

    const result = await db.collection('menus').updateOne(
      { _id: toObjectId(req.params.id) },
      { $set: updateData }
    );

    console.log('💾 Update result:', result);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    const updatedMenu = await db.collection('menus').findOne({ _id: toObjectId(req.params.id) });
    console.log('✅ Updated menu status:', updatedMenu.status);

    // Check for nested sub-items
    const countNestedItems = (items, depth = 0) => {
      let count = 0;
      if (items && Array.isArray(items)) {
        items.forEach(item => {
          count++;
          if (item.items && Array.isArray(item.items)) {
            count += countNestedItems(item.items, depth + 1);
          }
        });
      }
      return count;
    };

    const totalItems = countNestedItems(updatedMenu.items);
    console.log(`✅ Saved menu with ${totalItems} total items (including nested sub-items)`);

    res.json(updatedMenu);
  } catch (error) {
    console.error('❌ Update menu error:', error);
    res.status(500).json({ message: 'Failed to update menu' });
  }
}

async function remove(req, res) {
  try {
    const db = mongoose.connection.db;
    const result = await db.collection('menus').deleteOne({ _id: toObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Delete menu error:', error);
    res.status(500).json({ message: 'Failed to delete menu' });
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove
};
