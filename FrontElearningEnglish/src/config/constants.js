/**
 * Application Configuration
 * Central place for all external URLs and constants
 */

// ============================================
// API Configuration
// ============================================
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "/api";
export const AUTH_REFRESH_URL = `${API_BASE_URL}/auth/refresh-token`;

// ============================================
// Frontend Configuration
// ============================================
export const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || window.location.origin;

// ============================================
// OAuth Configuration
// ============================================
export const OAUTH_CONFIG = {
  google: {
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${FRONTEND_URL}/auth/google/callback`,
    scope: "openid email profile",
  },
  facebook: {
    appId: process.env.REACT_APP_FACEBOOK_APP_ID,
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    redirectUri: process.env.REACT_APP_FACEBOOK_REDIRECT_URI || `${FRONTEND_URL}/auth/facebook/callback`,
    scope: "email,public_profile",
  },
};

// ============================================
// External Services URLs
// ============================================
export const EXTERNAL_URLS = {
  // Social Media
  facebookGroup: "https://web.facebook.com/groups/843825855021989",
  
  // Third-party viewers/services
  googleDocsViewer: "https://docs.google.com/viewer",
  
  // Placeholder images
  placeholder: "https://via.placeholder.com",
  unsplashDefault: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  
  // Avatar generator
  uiAvatars: "https://ui-avatars.com/api",
};

// ============================================
// Helper Functions
// ============================================

/**
 * Generate UI Avatar URL
 * @param {string} name - User's name
 * @param {Object} options - Avatar options (background, color, size)
 * @returns {string} Avatar URL
 */
export const getAvatarUrl = (name = "User", options = {}) => {
  const {
    background = "6366f1",
    color = "fff",
    size = 128,
  } = options;
  
  return `${EXTERNAL_URLS.uiAvatars}/?name=${encodeURIComponent(name)}&background=${background}&color=${color}&size=${size}`;
};

/**
 * Generate placeholder image URL
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Placeholder text
 * @returns {string} Placeholder URL
 */
export const getPlaceholderUrl = (width = 300, height = 200, text = "No+Image") => {
  return `${EXTERNAL_URLS.placeholder}/${width}x${height}?text=${text}`;
};

/**
 * Generate Google Docs viewer URL
 * @param {string} documentUrl - URL of the document to view
 * @returns {string} Google Docs viewer URL
 */
export const getDocViewerUrl = (documentUrl) => {
  return `${EXTERNAL_URLS.googleDocsViewer}?url=${encodeURIComponent(documentUrl)}&embedded=true`;
};

// ============================================
// Application Constants
// ============================================
export const APP_CONSTANTS = {
  // Toast notifications
  TOAST_DURATION: 3000,
  
  // Notification polling
  NOTIFICATION_POLL_INTERVAL: 30000, // 30 seconds
  
  // Default images
  DEFAULT_COURSE_IMAGE: EXTERNAL_URLS.unsplashDefault,
};

export default {
  API_BASE_URL,
  AUTH_REFRESH_URL,
  FRONTEND_URL,
  OAUTH_CONFIG,
  EXTERNAL_URLS,
  APP_CONSTANTS,
  getAvatarUrl,
  getPlaceholderUrl,
  getDocViewerUrl,
};
