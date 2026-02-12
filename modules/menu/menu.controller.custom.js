const mongoose = require('mongoose');
const { createMenu } = require('./menu.service');

const ALLOWED_STATUSES = ['Created', 'Approved', 'Rejected'];

// Helper function to convert string ID to ObjectId
function toObjectId(id) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    return id; // Return as-is if conversion fails
  }
}

function getRoles(req) {
  const rawRoles = (req.user && req.user.roles) || [];
  const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  return roles.map((role) => String(role).toLowerCase());
}

function isAdmin(roles = []) {
  return roles.includes('admin') || roles.includes('super-admin');
}

function isCreator(roles = []) {
  return roles.includes('creator');
}

function normalizeStatus(status, fallback = 'Created') {
  if (!status) return fallback;
  return ALLOWED_STATUSES.includes(status) ? status : fallback;
}

function sanitizeItems(items, allowApproved) {
  if (!Array.isArray(items)) return items;

  return items.map((item) => {
    const next = { ...item };
    const hasId = Boolean(next._id);
    const status = normalizeStatus(next.status, 'Created');

    if (!allowApproved) {
      if ((status === 'Approved' || status === 'Rejected') && !hasId) {
        next.status = 'Created';
      } else if (!ALLOWED_STATUSES.includes(status)) {
        next.status = 'Created';
      } else {
        next.status = status;
      }
    } else {
      next.status = status;
    }

    if (Array.isArray(next.items)) {
      next.items = sanitizeItems(next.items, allowApproved);
    }

    return next;
  });
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
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const roles = getRoles(req);
    const admin = isAdmin(roles);
    const creator = isCreator(roles);

    if (!admin && !creator) {
      return res.status(403).json({ message: 'Creator or admin access required' });
    }

    const payload = { ...req.body };
    payload.status = admin ? normalizeStatus(payload.status, 'Created') : 'Created';
    payload.active = admin ? payload.active : false;
    if (Array.isArray(payload.items)) {
      payload.items = sanitizeItems(payload.items, admin);
    }

    const menu = await createMenu(payload);
    res.status(201).json(menu);
  } catch (error) {
    console.error('Create menu error:', error);
    res.status(500).json({ message: 'Failed to create menu', error: error.message });
  }
}

async function update(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const roles = getRoles(req);
    const admin = isAdmin(roles);
    const creator = isCreator(roles);

    if (!admin && !creator) {
      return res.status(403).json({ message: 'Creator or admin access required' });
    }

    const db = mongoose.connection.db;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    // Remove _id from updateData to avoid immutable field error
    delete updateData._id;

    if (!admin) {
      updateData.status = 'Created';
      updateData.active = false;
    } else if (updateData.status) {
      updateData.status = normalizeStatus(updateData.status, 'Created');
    }

    if (Array.isArray(updateData.items)) {
      updateData.items = sanitizeItems(updateData.items, admin);
    }

    const result = await db.collection('menus').updateOne(
      { _id: toObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    const updatedMenu = await db.collection('menus').findOne({ _id: toObjectId(req.params.id) });
    res.json(updatedMenu);
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({ message: 'Failed to update menu' });
  }
}

async function approve(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    const roles = getRoles(req);
    if (!isAdmin(roles)) return res.status(403).json({ message: 'Admin access required' });

    const db = mongoose.connection.db;
    const result = await db.collection('menus').updateOne(
      { _id: toObjectId(req.params.id) },
      { $set: { status: 'Approved', active: true, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    const updatedMenu = await db.collection('menus').findOne({ _id: toObjectId(req.params.id) });
    res.json(updatedMenu);
  } catch (error) {
    console.error('Approve menu error:', error);
    res.status(500).json({ message: 'Failed to approve menu' });
  }
}

async function reject(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    const roles = getRoles(req);
    if (!isAdmin(roles)) return res.status(403).json({ message: 'Admin access required' });

    const db = mongoose.connection.db;
    const result = await db.collection('menus').updateOne(
      { _id: toObjectId(req.params.id) },
      { $set: { status: 'Rejected', active: false, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    const updatedMenu = await db.collection('menus').findOne({ _id: toObjectId(req.params.id) });
    res.json(updatedMenu);
  } catch (error) {
    console.error('Reject menu error:', error);
    res.status(500).json({ message: 'Failed to reject menu' });
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
  approve,
  reject,
  remove
};
