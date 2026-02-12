require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { getRedis } = require('./config/redis');
const bookingEmailAutomation = require('./jobs/bookingEmailAutomation');

// Import routes
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const bookingRoutes = require('./routes/bookings');
const quickbooksRoutes = require('./routes/quickbooks');
const chatRoutes = require('./routes/chat');
const contactsRoutes = require('./routes/contacts');
const companiesRoutes = require('./routes/companies');
const dealsRoutes = require('./routes/deals');
const activityRoutes = require('./routes/activity');
const notificationRoutes = require('./routes/notifications');
const csvImportRoutes = require('./routes/csvImport');
const advancedBookingRoutes = require('./routes/advancedBooking');
const clientManagementRoutes = require('./routes/clientManagement');
const inventoryAlertRoutes = require('./routes/inventoryAlerts');
const imageRoutes = require('./routes/images');
const simpleEquipmentRoutes = require('./routes/simpleEquipment');
const teamManagementRoutes = require('./routes/teamManagement');
const projectRoutes = require('./routes/projects');
const documentRoutes = require('./routes/documents');
const searchRoutes = require('./routes/search');
const locationRoutes = require('./routes/locations');
const brandingRoutes = require('./routes/branding');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  skipSuccessfulRequests: true
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP logging
app.use(morgan('combined', { stream: logger.stream }));

// Request context middleware
app.use((req, res, next) => {
  req.requestId = require('crypto').randomUUID();
  req.io = io;
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const db = require('./config/database');
    await db.raw('SELECT 1');

    // Check Redis connection
    const redis = getRedis();
    await redis.ping();

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/equipment', simpleEquipmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/quickbooks', quickbooksRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/import', csvImportRoutes);
app.use('/api/bookings/advanced', advancedBookingRoutes);
app.use('/api/clients', clientManagementRoutes);
app.use('/api/inventory/alerts', inventoryAlertRoutes);
app.use('/api/team', teamManagementRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/images', imageRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join user's personal room for direct messages
  socket.on('authenticate', (data) => {
    if (data.userId) {
      socket.join(`user:${data.userId}`);
      socket.userId = data.userId;
      logger.info(`User ${data.userId} authenticated on socket ${socket.id}`);
    }
  });

  // Join channel
  socket.on('join_channel', (channelId) => {
    socket.join(`channel:${channelId}`);
    logger.info(`Socket ${socket.id} joined channel ${channelId}`);
  });

  // Leave channel
  socket.on('leave_channel', (channelId) => {
    socket.leave(`channel:${channelId}`);
    logger.info(`Socket ${socket.id} left channel ${channelId}`);
  });

  // Mark notification as read
  socket.on('mark_notification_read', async (data) => {
    try {
      const Notification = require('./models/Notification');
      await Notification.markAsRead(data.notificationId, socket.userId);
      socket.emit('notification_read', { notificationId: data.notificationId });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Function to send notification to user via socket
app.set('sendNotification', (userId, notification) => {
  io.to(`user:${userId}`).emit('notification', notification);
});

// Make io accessible to controllers
app.set('io', io);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.env} mode`);
  
  // Start background jobs
  if (config.env === 'production' || config.env === 'development') {
    bookingEmailAutomation.start();
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connections
  const db = require('./config/database');
  await db.destroy();
  
  // Close Redis connection
  const { closeRedis } = require('./config/redis');
  await closeRedis();

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  const db = require('./config/database');
  await db.destroy();
  
  const { closeRedis } = require('./config/redis');
  await closeRedis();

  process.exit(0);
});

module.exports = { app, io };
