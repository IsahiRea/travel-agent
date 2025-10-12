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
