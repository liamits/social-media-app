require('dotenv').config({ path: './.env' });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const filePath = path.join(__dirname, '../../frontend/public/img/default_avata.jpg');

cloudinary.uploader.upload(filePath, { folder: 'social-app', public_id: 'default_avatar' }, (err, result) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('✅ Uploaded:', result.secure_url);
  console.log('Copy URL above and set as default in User.js');
  process.exit(0);
});
