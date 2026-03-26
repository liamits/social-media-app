const express = require('express');
const multer = require('multer');
const auth = require('../middlewares/auth');
const { uploadToCloudinary } = require('../config/cloudinary');
const catchAsync = require('../common/catchAsync');
const ApiError = require('../common/ApiError');
const { sendResponse } = require('../common/response');

const router = express.Router();

// 50MB limit, accept image + gif + video
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new ApiError(400, 'File type not supported'));
  },
});

router.post('/', auth, upload.single('image'), catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const isVideo = req.file.mimetype.startsWith('video/');
  const result = await uploadToCloudinary(req.file.buffer, isVideo ? 'video' : 'image');
  sendResponse(res, 200, {
    url: result.secure_url,
    type: isVideo ? 'video' : req.file.mimetype === 'image/gif' ? 'gif' : 'image',
  });
}));

module.exports = router;
