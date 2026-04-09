const { createMenu, getMenu, listMenus, removeMenu, setMenuStatus, updateMenu } = require('./menu.service');

const ALLOWED_STATUSES = ['Created', 'Approved', 'Rejected'];

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

function normalizeSiblingOrders(items) {
  if (!Array.isArray(items)) return items;

  const used = new Set();
  let nextAuto = 1;

  return items.map((item) => {
    const next = { ...item };
    const requested = Number(next.order);
    let resolvedOrder =
      Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : null;

    if (!resolvedOrder || used.has(resolvedOrder)) {
      while (used.has(nextAuto)) {
        nextAuto += 1;
      }
      resolvedOrder = nextAuto;
      nextAuto += 1;
    }

    used.add(resolvedOrder);
    next.order = resolvedOrder;

    if (Array.isArray(next.items)) {
      next.items = normalizeSiblingOrders(next.items);
    }

    return next;
  });
}

function sanitizeItems(items, allowApproved) {
  if (!Array.isArray(items)) return items;

  const cleaned = items.map((item) => {
    const next = { ...item };
    const hasId = Boolean(next._id || next.id);
    const status = normalizeStatus(next.status, 'Created');

    if (!allowApproved) {
      if ((status === 'Approved' || status === 'Rejected') && !hasId) {
        next.status = 'Created';
      } else {
        next.status = ALLOWED_STATUSES.includes(status) ? status : 'Created';
      }
    } else {
      next.status = status;
    }

    if (Array.isArray(next.items)) {
      next.items = sanitizeItems(next.items, allowApproved);
    }

    return next;
  });

  return normalizeSiblingOrders(cleaned);
}

async function list(req, res) {
  try {
    const { limit, skip, status } = req.query;
    const menus = await listMenus({
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
      status: status || undefined,
    });
    res.json(menus);
  } catch (error) {
    console.error('List menus error:', error);
    res.status(500).json({ message: 'Failed to fetch menus' });
  }
}

async function getById(req, res) {
  try {
    const menu = await getMenu(req.params.id);
    if (!menu) return res.status(404).json({ message: 'Menu not found' });
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

    const updateData = { ...req.body };

    if (!admin) {
      updateData.status = 'Created';
      updateData.active = false;
    } else if (updateData.status) {
      updateData.status = normalizeStatus(updateData.status, 'Created');
    }

    if (Array.isArray(updateData.items)) {
      updateData.items = sanitizeItems(updateData.items, admin);
    }

    const updatedMenu = await updateMenu(req.params.id, updateData);
    if (!updatedMenu) return res.status(404).json({ message: 'Menu not found' });
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

    const updatedMenu = await setMenuStatus(req.params.id, { status: 'Approved', active: true });
    if (!updatedMenu) return res.status(404).json({ message: 'Menu not found' });
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

    const updatedMenu = await setMenuStatus(req.params.id, { status: 'Rejected', active: false });
    if (!updatedMenu) return res.status(404).json({ message: 'Menu not found' });
    res.json(updatedMenu);
  } catch (error) {
    console.error('Reject menu error:', error);
    res.status(500).json({ message: 'Failed to reject menu' });
  }
}

async function remove(req, res) {
  try {
    const removed = await removeMenu(req.params.id);
    if (!removed) return res.status(404).json({ message: 'Menu not found' });
    res.status(204).end();
  } catch (error) {
    console.error('Delete menu error:', error);
    res.status(500).json({ message: 'Failed to delete menu' });
  }
}

module.exports = {
  approve,
  create,
  getById,
  list,
  reject,
  remove,
  update,
};
