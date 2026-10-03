/**
 * ==============================================================================
 * LeetCode2Git - Centralized Extension Configuration
 * ==============================================================================
 * Single source of truth for backend communication in both dev and production.
 *
 * PRODUCTION SETUP:
 * 1. Deploy the backend to a public HTTPS domain (e.g. https://YOUR-PUBLIC-BACKEND.com)
 * 2. Change BACKEND_URL below to your deployed domain.
 * ==============================================================================
 */

// Change this single line for production deployment:
const BACKEND_URL = 'http://localhost:5000'; // Development
// const BACKEND_URL = 'https://YOUR-PUBLIC-BACKEND.com'; // Production

const CONFIG = {
  BACKEND_URL,
  API_BASE_URL: `${BACKEND_URL}/api`,
  AUTH_URL: `${BACKEND_URL}/api/auth/github`,
  VERSION: '1.0.0',
  APP_NAME: 'LeetCode2Git'
};

// Support both Service Worker (importScripts) and Window (Popup / Content Script) contexts
if (typeof self !== 'undefined') {
  self.CONFIG = CONFIG;
  self.BACKEND_URL = BACKEND_URL;
}
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
  window.BACKEND_URL = BACKEND_URL;
}
