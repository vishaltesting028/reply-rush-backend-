// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();

// Import Instagram OAuth routes
const instagramUnifiedAuth = require('./src/routes/instagramUnified');
const instagramRoutes = require('./src/routes/instagram');
const instagramGraphRoutes = require('./src/routes/instagramGraph');
const instagramUniversalRoutes = require('./src/routes/instagramUniversal');
const authRoutes = require('./src/routes/auth');

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || "keyboard cat",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/ReplyRushh'
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // set secure:true in prod with HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ReplyRushh', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use("/auth", instagramUnifiedAuth);
app.use('/api/instagram', instagramRoutes);
app.use('/instagram', instagramGraphRoutes); // New Instagram Graph API routes
app.use('/instagram-universal', instagramUniversalRoutes); // Fallback universal routes
app.use('/api/auth', authRoutes);

// Catch-all route for debugging
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("Server listening on", port));
