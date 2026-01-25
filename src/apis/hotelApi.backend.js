/**
 * Hotel API Module (Secure Backend Version)
 * Handles all hotel-related API calls via secure backend
 * API Documentation: https://developers.amadeus.com/
 */

import { apiPost, withErrorHandling } from '../utils/apiClient.js';

/**
 * Fetch hotel data from secure backend endpoint
 * @param {Object} tripData - Trip planning data
 * @param {string} tripData.arriveAt - Destination city
 * @param {string} tripData.departDate - Check-in date (YYYY-MM-DD)
 * @param {string} tripData.returnDate - Check-out date (YYYY-MM-DD)
 * @param {number} tripData.travelers - Number of guests
 * @returns {Promise<Object>} Hotel search results
 */
export async function fetchHotelData(tripData) {
  return withErrorHandling(
    () => apiPost('/api/hotels', {
      arriveAt: tripData.arriveAt,
      departDate: tripData.departDate,
      returnDate: tripData.returnDate,
      travelers: tripData.travelers,
    }, {
      serviceName: 'hotels',
      errorMessage: 'Failed to fetch hotels',
    }),
    'hotel'
  );
}
