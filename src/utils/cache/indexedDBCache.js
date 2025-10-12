/**
 * Base IndexedDB Cache Class
 * Reusable cache implementation with get/set/cleanup/stats functionality
 * Reduces code duplication across different cache types
 */

import { initDB } from './cacheDB.js';
import { formatCacheAge, normalizeQuery } from '../formatters.js';
import {
  logCacheHit,
  logCacheMiss,
  logCacheSet,
  logCacheExpired,
  logCacheCleanup,
  logCacheCleared,
  logCacheError
} from '../logger.js';

/**
 * IndexedDB Cache Base Class
 */
export class IndexedDBCache {
  /**
   * @param {string} storeName - Name of the IndexedDB object store
   * @param {string} cacheName - Human-readable cache name for logging
   * @param {number} cacheDuration - Cache duration in milliseconds
   */
  constructor(storeName, cacheName, cacheDuration) {
    this.storeName = storeName;
    this.cacheName = cacheName;
    this.cacheDuration = cacheDuration;

    // Auto-run cleanup on instantiation
    this.cleanOldCache().catch(error => {
      console.warn(`Initial ${cacheName} cache cleanup failed:`, error);
    });
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null if not found/expired
   */
  async get(key) {
    try {
      const db = await initDB();
      const normalizedKey = normalizeQuery(key);

      const cached = await db.get(this.storeName, normalizedKey);

      if (cached) {
        const age = Date.now() - cached.timestamp;

        if (age < this.cacheDuration) {
          const ageDisplay = formatCacheAge(age);
          const value = this.formatValue(cached);
          logCacheHit(this.cacheName, key, value, ageDisplay);
          return this.extractValue(cached);
        } else {
          // Cache expired - remove it
          await db.delete(this.storeName, normalizedKey);
          const ageDisplay = formatCacheAge(age);
          logCacheExpired(this.cacheName, key, ageDisplay);
        }
      } else {
        logCacheMiss(this.cacheName, key);
      }

      return null;
    } catch (error) {
      logCacheError(this.cacheName, 'reading from', error);
      return null; // Fail gracefully
    }
  }

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @returns {Promise<void>}
   */
  async set(key, value) {
    try {
      const db = await initDB();
      const normalizedKey = normalizeQuery(key);

      const cacheEntry = {
        query: normalizedKey,
        ...this.createCacheEntry(value, key),
        timestamp: Date.now()
      };

      await db.put(this.storeName, cacheEntry);

      const valueDisplay = this.formatValue(cacheEntry);
      logCacheSet(this.cacheName, key, valueDisplay);
    } catch (error) {
      logCacheError(this.cacheName, 'writing to', error);
      // Non-critical - app continues without caching
    }
  }

  /**
   * Clean expired cache entries
   * @returns {Promise<number>} Number of entries removed
   */
  async cleanOldCache() {
    try {
      const db = await initDB();
      const allEntries = await db.getAll(this.storeName);
      const now = Date.now();

      let removedCount = 0;

      for (const entry of allEntries) {
        const age = now - entry.timestamp;
        if (age >= this.cacheDuration) {
          await db.delete(this.storeName, entry.query);
          removedCount++;
        }
      }

      logCacheCleanup(this.cacheName, removedCount);

      return removedCount;
    } catch (error) {
      logCacheError(this.cacheName, 'cleaning', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    try {
      const db = await initDB();
      const allEntries = await db.getAll(this.storeName);
      const now = Date.now();

      let validCount = 0;
      let expiredCount = 0;
      let oldestTimestamp = null;
      let newestTimestamp = null;

      for (const entry of allEntries) {
        const age = now - entry.timestamp;

        if (age < this.cacheDuration) {
          validCount++;
        } else {
          expiredCount++;
        }

        if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
        }
        if (!newestTimestamp || entry.timestamp > newestTimestamp) {
          newestTimestamp = entry.timestamp;
        }
      }

      return {
        totalEntries: allEntries.length,
        validEntries: validCount,
        expiredEntries: expiredCount,
        oldestEntry: oldestTimestamp,
        newestEntry: newestTimestamp,
        cacheSize: JSON.stringify(allEntries).length
      };
    } catch (error) {
      logCacheError(this.cacheName, 'getting stats for', error);
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        oldestEntry: null,
        newestEntry: null,
        cacheSize: 0,
        error: error.message
      };
    }
  }

  /**
   * Clear all cached entries
   * @returns {Promise<void>}
   */
  async clearAll() {
    try {
      const db = await initDB();
      await db.clear(this.storeName);
      logCacheCleared(this.cacheName);
    } catch (error) {
      logCacheError(this.cacheName, 'clearing', error);
    }
  }

  // Template methods to be overridden by subclasses

  /**
   * Create cache entry from value
   * Override this to customize cache entry structure
   * @param {any} value - Value to cache
   * @param {string} originalKey - Original key (for debugging)
   * @returns {Object} Cache entry data
   */
  createCacheEntry(value, originalKey) {
    return {
      value,
      originalQuery: originalKey
    };
  }

  /**
   * Extract value from cache entry
   * Override this to customize value extraction
   * @param {Object} cached - Cached entry
   * @returns {any} Extracted value
   */
  extractValue(cached) {
    return cached.value;
  }

  /**
   * Format value for logging
   * Override this to customize log display
   * @param {Object} cached - Cached entry
   * @returns {string} Formatted value string
   */
  formatValue(cached) {
    return JSON.stringify(cached.value);
  }
}
