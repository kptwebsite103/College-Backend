const express = require('express');
const router = express.Router();

// Test basic route
router.get('/', (req, res) => {
  res.json({ message: 'Pages API working' });
});

module.exports = router;
