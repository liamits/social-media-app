require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const DEFAULT = 'https://res.cloudinary.com/djx14arnq/image/upload/v1774602464/social-app/default_avatar.jpg';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await User.updateMany(
    { $or: [{ avatar: { $exists: false } }, { avatar: null }, { avatar: '' }, { avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default' }] },
    { $set: { avatar: DEFAULT } }
  );
  console.log(`✅ Updated ${result.modifiedCount} users`);
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
