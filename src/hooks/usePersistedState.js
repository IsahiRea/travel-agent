import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for state that persists to localStorage
 * @param {string} key - localStorage key
 * @param {*} defaultValue - Default value if nothing in localStorage
 * @param {number} expirationDays - Optional expiration in days (default: 7)
 * @returns {[*, Function, Function]} [state, setState, clearState]
 */
export function usePersistedState(key, defaultValue, expirationDays = 7) {
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);

      // Check for expiration
      if (parsed.timestamp) {
        const age = Date.now() - parsed.timestamp;
        const maxAge = expirationDays * 24 * 60 * 60 * 1000;

        if (age > maxAge) {
          // Expired - clear and return default
          localStorage.removeItem(key);
          return defaultValue;
        }

        return parsed.value;
      }

      // Old format without timestamp
      return parsed;
    } catch (error) {
      console.error(`Error loading from localStorage (key: ${key}):`, error);
      return defaultValue;
    }
  });

  const debounceTimer = useRef(null);

  // Save to localStorage with debouncing
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      try {
        const data = {
          value: state,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        // Handle quota exceeded or other errors
        console.error(`Error saving to localStorage (key: ${key}):`, error);

        // If quota exceeded, try to clear old data
        if (error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded. Clearing old trip data...');
          clearOldTripData();
        }
      }
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [key, state]);

  // Function to clear this specific state
  const clearState = () => {
    try {
      localStorage.removeItem(key);
      setState(defaultValue);
    } catch (error) {
      console.error(`Error clearing localStorage (key: ${key}):`, error);
    }
  };

  return [state, setState, clearState];
}

/**
 * Helper function to clear old trip data from localStorage
 */
function clearOldTripData() {
  try {
    const keysToCheck = [];

    // Get all keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('trip-')) {
        keysToCheck.push(key);
      }
    }

    // Check age and remove old items
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    keysToCheck.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.timestamp && (now - parsed.timestamp > maxAge)) {
            localStorage.removeItem(key);
            console.log(`Removed expired localStorage item: ${key}`);
          }
        }
      } catch {
        // If we can't parse it, it might be old format - remove it
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing old trip data:', error);
  }
}

/**
 * Hook for managing complete form state with single localStorage key
 * @param {string} key - localStorage key
 * @param {Object} defaultFormState - Default form state object
 * @param {number} expirationDays - Optional expiration in days (default: 7)
 * @returns {[Object, Function, Function]} [formState, updateFormState, clearFormState]
 */
export function usePersistedFormState(key, defaultFormState, expirationDays = 7) {
  const [formState, setFormState, clearFormState] = usePersistedState(
    key,
    defaultFormState,
    expirationDays
  );

  // Helper to update a single field
  const updateFormState = (field, value) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return [formState, updateFormState, clearFormState];
}
