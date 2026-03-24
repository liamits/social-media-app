const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.get('/', (req, res) => {
  res.send('Instagram Clone API is running...');
});

module.exports = app;
