/**
 * API Configuration
 * Use a relative path for local development so requests target the running app.
 */
const API_BASE_URL = '';

// Helper function to construct API URLs
function apiUrl(path) {
  return API_BASE_URL + path;
}
