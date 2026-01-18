require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const songsRoutes = require('./routes/songs'); 
const statsRoutes = require('./routes/stats'); 

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));

app.use('/api/stats', statsRoutes);


app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/songs', songsRoutes); 
app.use('/api/users', require('./routes/users'));
app.use('/api/popular', require('./routes/popular'));
app.get('/', (req, res) => res.send('MusicMatch backend running'));

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
