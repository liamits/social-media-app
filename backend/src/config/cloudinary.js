const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const uploadToCloudinary = (buffer, resourceType = 'image') => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    const options = { folder: 'social-app' };
    if (resourceType === 'video') {
      options.resource_type = 'video';
      options.transformation = [{ width: 720, crop: 'limit' }];
    } else {
      options.transformation = [{ width: 1080, crop: 'limit' }];
    }

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
};

module.exports = { upload, uploadToCloudinary };
