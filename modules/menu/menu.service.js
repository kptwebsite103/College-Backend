const Menu = require('./menu.model');

async function createMenu(payload) {
  // enforce unique slug at service level to provide clear error
  if (payload && payload.slug) {
    const exists = await Menu.exists({ slug: payload.slug });
    if (exists) {
      const err = new Error('Slug already exists');
      err.status = 409;
      throw err;
    }
  }

  const doc = new Menu(payload);
  return doc.save();
}

async function listMenus({ limit = 20, skip = 0, q, active, type } = {}) {
  const filter = {};
  if (typeof active === 'boolean') filter.active = active;
  if (q) filter['name.en'] = new RegExp(q, 'i');
  if (type) filter.type = type;

  const menus = await Menu.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).lean();

  // Count nested items for debugging
  const countNested = (items, depth = 0) => {
    let count = 0;
    if (items && Array.isArray(items)) {
      items.forEach(item => {
        count++;
        if (item.items && Array.isArray(item.items)) {
          count += countNested(item.items, depth + 1);
        }
      });
    }
    return count;
  };

  menus.forEach(menu => {
    const totalItems = countNested(menu.items);
    console.log(`📊 Backend listMenus: Menu "${menu.name?.en || menu.slug}" has ${totalItems} total items (including nested)`);
  });

  console.log(`📤 Backend returning ${menus.length} menus to frontend`);
  return menus;
}

async function getMenu(id) {
  return Menu.findById(id).lean();
}

async function updateMenu(id, payload) {
  // if slug is changed, ensure uniqueness
  if (payload && payload.slug) {
    const existing = await Menu.findOne({ slug: payload.slug });
    if (existing && String(existing._id) !== String(id)) {
      const err = new Error('Slug already exists');
      err.status = 409;
      throw err;
    }
  }

  return Menu.findByIdAndUpdate(id, payload, { new: true }).lean();
}

async function removeMenu(id) {
  return Menu.findByIdAndDelete(id);
}

module.exports = { createMenu, listMenus, getMenu, updateMenu, removeMenu };
