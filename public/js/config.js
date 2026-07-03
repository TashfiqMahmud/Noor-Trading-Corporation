/**
 * API Configuration
 * Change API_BASE_URL for different environments
 */
const API_BASE_URL = 'https://noor-trading-corporation.onrender.com';

// Helper function to construct API URLs
function apiUrl(path) {
  return API_BASE_URL + path;
}
