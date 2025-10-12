/**
 * Centralized IndexedDB Schema Management
 * Single source of truth for database structure and versioning
 */

import { openDB } from 'idb';
import { logStoreCreated } from '../logger.js';

// Database configuration
export const DB_NAME = 'travel-agent-cache';
export const DB_VERSION = 2;

// Object store configurations
export const STORES = {
  AIRPORT_CODES: {
    name: 'airport-codes',
    keyPath: 'query',
    indexes: [{ name: 'timestamp', keyPath: 'timestamp' }]
  },
  COORDINATES: {
    name: 'city-coordinates',
    keyPath: 'query',
    indexes: []
  }
};

/**
 * Initialize IndexedDB with all required object stores
 * Handles version upgrades automatically
 * @returns {Promise<IDBDatabase>} Database instance
 */
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Version 1: Create airport-codes store
      if (oldVersion < 1) {
        const airportStore = STORES.AIRPORT_CODES;
        if (!db.objectStoreNames.contains(airportStore.name)) {
          const store = db.createObjectStore(airportStore.name, {
            keyPath: airportStore.keyPath
          });

          // Create indexes
          airportStore.indexes.forEach(index => {
            store.createIndex(index.name, index.keyPath);
          });

          logStoreCreated(airportStore.name);
        }
      }

      // Version 2: Create city-coordinates store
      if (oldVersion < 2) {
        const coordsStore = STORES.COORDINATES;
        if (!db.objectStoreNames.contains(coordsStore.name)) {
          db.createObjectStore(coordsStore.name, {
            keyPath: coordsStore.keyPath
          });

          logStoreCreated(coordsStore.name);
        }
      }
    },
  });
}
