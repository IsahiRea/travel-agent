/**
 * Cache Logger Utilities
 * Centralized logging for cache operations with consistent formatting
 */

/**
 * Log cache hit
 * @param {string} cacheName - Name of the cache (e.g., "Airport Code", "Coordinates")
 * @param {string} key - Cache key that was hit
 * @param {string} value - Value retrieved from cache
 * @param {string} age - Formatted age string
 */
export function logCacheHit(cacheName, key, value, age) {
  console.log(`✓ ${cacheName} Cache HIT: "${key}" → ${value} (age: ${age})`);
}

/**
 * Log cache miss
 * @param {string} cacheName - Name of the cache
 * @param {string} key - Cache key that was missed
 */
export function logCacheMiss(cacheName, key) {
  console.log(`✗ ${cacheName} Cache MISS: "${key}"`);
}

/**
 * Log cache set operation
 * @param {string} cacheName - Name of the cache
 * @param {string} key - Cache key being set
 * @param {string} value - Value being cached
 */
export function logCacheSet(cacheName, key, value) {
  console.log(`✓ ${cacheName} Cache SET: "${key}" → ${value}`);
}

/**
 * Log cache expiration
 * @param {string} cacheName - Name of the cache
 * @param {string} key - Cache key that expired
 * @param {string} age - Formatted age string
 */
export function logCacheExpired(cacheName, key, age) {
  console.log(`✗ ${cacheName} Cache EXPIRED: "${key}" (age: ${age})`);
}

/**
 * Log cache cleanup
 * @param {string} cacheName - Name of the cache
 * @param {number} count - Number of entries removed
 */
export function logCacheCleanup(cacheName, count) {
  if (count > 0) {
    console.log(`✓ ${cacheName} Cache cleanup: Removed ${count} expired entries`);
  }
}

/**
 * Log cache cleared
 * @param {string} cacheName - Name of the cache
 */
export function logCacheCleared(cacheName) {
  console.log(`✓ ${cacheName} Cache cleared: All entries removed`);
}

/**
 * Log cache error
 * @param {string} cacheName - Name of the cache
 * @param {string} operation - Operation that failed
 * @param {Error} error - Error object
 */
export function logCacheError(cacheName, operation, error) {
  console.error(`Error ${operation} ${cacheName} cache:`, error);
}

/**
 * Log IndexedDB store creation
 * @param {string} storeName - Name of the object store
 */
export function logStoreCreated(storeName) {
  console.log(`IndexedDB: Created ${storeName} object store`);
}
