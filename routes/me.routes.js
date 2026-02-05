const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');

// Returns the authenticated user information for debugging
router.get('/me', auth, (req, res) => {
  // Never return raw tokens or secret information
  const safeUser = {
    id: req.user.id,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    roles: req.user.roles,
  };
  res.json(safeUser);
});

module.exports = router;
