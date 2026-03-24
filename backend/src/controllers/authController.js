const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = await User.findOne({ username });
    if (user) return res.status(400).json({ message: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ username, email, password: hashedPassword, fullName });
    
    await user.save();
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, username, email, fullName, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    const user = await User.findOne({ 
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }] 
    });
    
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, fullName: user.fullName, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login
};
