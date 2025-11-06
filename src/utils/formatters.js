/**
 * Formatting Utilities
 * Shared formatting functions for cache ages, sizes, and other data
 */

/**
 * Format cache age in human-readable format
 * @param {number} ageMs - Age in milliseconds
 * @returns {string} Formatted age string (e.g., "5 min", "2 hr", "3 days")
 */
export function formatCacheAge(ageMs) {
  const minutes = Math.round(ageMs / (1000 * 60));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  if (minutes < 1440) { // Less than 24 hours
    return `${Math.round(minutes / 60)} hr`;
  }

  return `${Math.round(minutes / 1440)} days`;
}

/**
 * Format cache size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string (e.g., "1.5 KB", "2.3 MB")
 */
export function formatCacheSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Normalize query string for cache keys
 * @param {string} query - Raw query string
 * @returns {string} Normalized query (lowercase, trimmed)
 */
export function normalizeQuery(query) {
  return query.toLowerCase().trim();
}

/**
 * Format date string to user-friendly format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "Nov 23")
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Format flight duration from ISO 8601 format
 * @param {string} duration - Duration in ISO format (e.g., "PT8H30M")
 * @returns {string} Formatted duration (e.g., "8h 30m")
 */
export function formatDuration(duration) {
  if (!duration) return '';
  const match = duration.match(/PT(\d+H)?(\d+M)?/);
  if (!match) return duration;

  const hours = match[1] ? match[1].replace('H', 'h') : '';
  const minutes = match[2] ? ' ' + match[2].replace('M', 'm') : '';
  return hours + minutes;
}

/**
 * Format time from ISO string
 * @param {string} timeStr - ISO time string
 * @returns {string} Formatted time (e.g., "10:30 AM")
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
