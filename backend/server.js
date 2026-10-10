const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');
const solutionRoutes = require('./routes/solutions');
const privacyController = require('./controllers/privacyController');

const app = express();
const PORT = config.port;

// Connect to MongoDB
if (config.nodeEnv !== 'test') {
  connectDB();
}

// Configurable CORS to support multi-user public Chrome Extensions and deployment
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Allow all Chrome extension origins
      if (origin.startsWith('chrome-extension://')) {
        return callback(null, true);
      }

      // Check configured origins or wildcard
      if (
        config.corsOrigin === '*' ||
        allowedOrigins.includes(origin) ||
        (config.nodeEnv !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1')))
      ) {
        return callback(null, true);
      }

      // Allow configured domains
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'LeetCode2Git Public Backend API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      privacy: '/privacy',
      auth: '/api/auth/github',
      docs: 'https://github.com/bgukhan204-tech/leet-extention'
    }
  });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'LeetCode2Git backend is running',
    environment: config.nodeEnv,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Public Privacy Policy Endpoints (HTML)
app.get('/privacy', privacyController.renderPrivacyPolicy);
app.get('/api/privacy', privacyController.renderPrivacyPolicy);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/solutions', solutionRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Central Error Handler
app.use(errorHandler);

// Start Server if run directly
if (config.nodeEnv !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 LeetCode2Git Multi-User Backend running on port ${PORT}`);
    console.log(`🌐 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 GitHub OAuth: http://localhost:${PORT}/api/auth/github`);
    console.log(`====================================================`);
  });
}

module.exports = app;
