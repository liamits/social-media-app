const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: req.file.path });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = router;
