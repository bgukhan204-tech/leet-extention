/**
 * ==============================================================================
 * LeetCode2Git - Centralized Extension Configuration
 * ==============================================================================
 * Single source of truth for backend communication in both dev and production.
 * ==============================================================================
 */

// Production Public Backend URL on Render
const BACKEND_URL = 'https://leetcode2git-backend.onrender.com';

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
