/**
 * Flight API Module (Secure Backend Version)
 * Handles all flight-related API calls via secure backend
 * API Documentation: https://developers.amadeus.com/
 */

import { apiPost, apiGet, withErrorHandling } from '../utils/apiClient.js';

/**
 * Fetch flight data from secure backend endpoint
 * @param {Object} tripData - Trip planning data
 * @param {string} tripData.departFrom - Departure city/airport
 * @param {string} tripData.arriveAt - Arrival city/airport
 * @param {string} tripData.departDate - Departure date (YYYY-MM-DD)
 * @param {string} tripData.returnDate - Return date (YYYY-MM-DD)
 * @param {number} tripData.travelers - Number of adult travelers
 * @returns {Promise<Object>} Flight search results
 */
export async function fetchFlightData(tripData) {
  return withErrorHandling(
    () => apiPost('/api/flights', {
      departFrom: tripData.departFrom,
      arriveAt: tripData.arriveAt,
      departDate: tripData.departDate,
      returnDate: tripData.returnDate,
      travelers: tripData.travelers,
    }, {
      serviceName: 'flights',
      errorMessage: 'Failed to fetch flights',
    }),
    'flight'
  );
}

/**
 * Search for city/airport suggestions for autocomplete
 * @param {string} keyword - Search keyword (city or airport name)
 * @returns {Promise<Array>} Array of location suggestions
 */
export async function searchCityAirports(keyword) {
  const normalized = keyword.trim();

  // Don't search for very short queries
  if (normalized.length < 2) {
    return [];
  }

  try {
    const data = await apiGet(
      `/api/city-search?keyword=${encodeURIComponent(normalized)}`,
      {
        serviceName: 'city search',
        errorMessage: 'Failed to search cities',
        returnEmptyOnError: true,
      }
    );
    return data || [];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}
