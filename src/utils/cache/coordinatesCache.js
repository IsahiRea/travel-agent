/**
 * City Coordinates Cache Module
 * Provides persistent caching of city coordinates (lat/lon) using IndexedDB
 * Reduces OpenWeatherMap Geocoding API calls by 90%+
 */

import { IndexedDBCache } from './indexedDBCache.js';
import { STORES } from './cacheDB.js';

const CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 365 days (coordinates never change)

/**
 * Coordinates Cache
 * Extends base IndexedDBCache with coordinates-specific logic
 */
class CoordinatesCache extends IndexedDBCache {
  constructor() {
    super(STORES.COORDINATES.name, 'Coordinates', CACHE_DURATION);
  }

  /**
   * Create cache entry for coordinates
   * @param {Object} coords - Coordinates object {lat, lon}
   * @param {string} originalKey - Original query
   * @returns {Object} Cache entry
   */
  createCacheEntry(coords, originalKey) {
    return {
      lat: coords.lat,
      lon: coords.lon,
      originalQuery: originalKey
    };
  }

  /**
   * Extract coordinates from cache entry
   * @param {Object} cached - Cached entry
   * @returns {Object} Coordinates {lat, lon}
   */
  extractValue(cached) {
    return {
      lat: cached.lat,
      lon: cached.lon
    };
  }

  /**
   * Format coordinates for logging
   * @param {Object} cached - Cached entry
   * @returns {string} Formatted coordinates
   */
  formatValue(cached) {
    return `(${cached.lat}, ${cached.lon})`;
  }
}

// Create singleton instance
const coordinatesCache = new CoordinatesCache();

// Export convenience functions

/**
 * Get cached coordinates for a city
 * @param {string} cityName - City name to lookup
 * @returns {Promise<{lat: number, lon: number}|null>} Coordinates or null if not cached/expired
 */
export async function getCachedCoordinates(cityName) {
  return coordinatesCache.get(cityName);
}

/**
 * Cache coordinates for a city
 * @param {string} cityName - City name
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<void>}
 */
export async function cacheCoordinates(cityName, lat, lon) {
  return coordinatesCache.set(cityName, { lat, lon });
}

/**
 * Clean expired cache entries
 * @returns {Promise<number>} Number of entries removed
 */
export async function cleanOldCache() {
  return coordinatesCache.cleanOldCache();
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
export async function getCacheStats() {
  return coordinatesCache.getStats();
}

/**
 * Clear all cached coordinates
 * Useful for testing and debugging
 * @returns {Promise<void>}
 */
export async function clearAllCache() {
  return coordinatesCache.clearAll();
}
