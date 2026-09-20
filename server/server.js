const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
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
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    restaurant: 'Subbayya Gari Hotel',
  });
});

// Serve Owner static files at /owner
app.use('/owner', express.static(path.join(__dirname, '../owner')));

// Serve Customer static files at root /
app.use(express.static(path.join(__dirname, '../')));

// Fallback route for SPA or owner subpaths
app.get('/owner/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../owner/index.html'));
});

// Socket.IO Events
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_owner', () => {
    socket.join('owner_room');
    console.log(`[Socket.IO] Socket ${socket.id} joined owner_room`);
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
      console.log(`  🌾 SUBBAYYA GARI HOTEL — FULL STACK SERVER 🌾`);
      console.log(`  🚀 Server Running on: http://localhost:${PORT}`);
      console.log(`  🍽️ Customer Website:  http://localhost:${PORT}/`);
      console.log(`  👑 Owner Portal:      http://localhost:${PORT}/owner/`);
      console.log(`  🔑 Default Owner:     ${process.env.OWNER_EMAIL || 'owner@subbayya.com'} / ${process.env.OWNER_PASSWORD || 'Subbayya@1950'}`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('[Server Start Error]:', err);
  }
};

startServer();
