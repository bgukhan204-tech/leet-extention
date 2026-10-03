require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/leetcode2git',
  
  // GitHub OAuth App Configuration
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  
  // Base URLs
  backendUrl: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`,
  get githubCallbackUrl() {
    return process.env.GITHUB_CALLBACK_URL || `${this.backendUrl}/api/auth/github/callback`;
  },
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_leetcode2git_multi_user_key_98765',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  
  // CORS and Client Origins
  corsOrigin: process.env.CORS_ORIGIN || '*',
  frontendUrl: process.env.FRONTEND_URL || ''
};

module.exports = config;
