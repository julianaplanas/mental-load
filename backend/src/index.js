require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const pool = require('./db');
const usersRouter = require('./routes/users');
const cardsRouter = require('./routes/cards');
const groceryRouter = require('./routes/grocery');
const { initScheduler } = require('./scheduler');
const statsRouter = require('./routes/stats');

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.NODE_ENV === 'production'
  ? process.env.FRONTEND_URL
  : '*';

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

// Middleware
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/users', usersRouter);
app.use('/cards', cardsRouter);
app.use('/grocery', groceryRouter);
app.use('/stats', statsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'noi-backend' });
});

// Socket.io — real-time sync
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Noi backend running on port ${PORT}`);
  initScheduler();
});

// Export io for use in other modules (notifications, etc.)
module.exports = { io };
