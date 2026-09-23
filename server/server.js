const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seed');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach Socket.IO to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Request Logger (Development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });
}

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));

// Health Check
app.get('/api/health', (req, res) => {
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const dbState = mongoose.connection.readyState;
  res.status(200).json({
    status: 'OK',
    version: '11.0.0',
    platform: 'Render',
    database: dbStates[dbState] || 'unknown',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    restaurant: 'Subbayya Gari Hotel',
  });
});

// Serve Owner Portal static files at root / and /owner
app.use(express.static(path.join(__dirname, '../owner')));
app.use('/owner', express.static(path.join(__dirname, '../owner')));

// Fallback route for non-API web navigation to Owner Portal
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../owner/index.html'));
});

// Socket.IO Events
const { getBranchRoomKey } = require('./utils/branchHelper');

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_owner', (data) => {
    socket.join('owner_room');
    const branchName = typeof data === 'string' ? data : (data && data.branch ? data.branch : null);
    const roomKey = getBranchRoomKey(branchName);
    if (roomKey) {
      socket.join(`owner_branch_${roomKey}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined owner_room & owner_branch_${roomKey}`);
    } else {
      console.log(`[Socket.IO] Socket ${socket.id} joined owner_room (all branches)`);
    }
  });

  socket.on('join_order_tracking', (orderNumber) => {
    if (orderNumber) {
      const room = `order_${orderNumber.toUpperCase()}`;
      socket.join(room);
      console.log(`[Socket.IO] Socket ${socket.id} tracking ${room}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server & Connect Database
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    server.listen(PORT, () => {
      console.log('====================================================');
      console.log(`  🌾 SUBBAYYA GARI HOTEL — OWNER PORTAL SERVER v11.0.0 🌾`);
      console.log(`  🚀 Server Running on: http://localhost:${PORT}`);
      console.log(`  👑 Owner Portal:      http://localhost:${PORT}/ (or /owner/)`);
      console.log(`  🔑 Default Owner:     ${process.env.OWNER_EMAIL || 'owner@subbayya.com'} / ${process.env.OWNER_PASSWORD || 'Subbayya@1950'}`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('[Server Start Error]:', err);
  }
};

startServer();
