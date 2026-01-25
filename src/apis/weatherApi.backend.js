/**
 * Weather API Module (Secure Backend Version)
 * Handles all weather-related API calls via secure backend
 * API Documentation: https://openweathermap.org/api
 */

import { apiPost, withErrorHandling } from '../utils/apiClient.js';

/**
 * Fetch weather forecast data from secure backend endpoint
 * @param {Object} tripData - Trip planning data
 * @param {string} tripData.arriveAt - Destination city
 * @param {string} tripData.departDate - Check-in date (YYYY-MM-DD)
 * @param {string} tripData.returnDate - Check-out date (YYYY-MM-DD)
 * @returns {Promise<Object>} Weather forecast data
 */
export async function fetchWeatherData(tripData) {
  return withErrorHandling(
    () => apiPost('/api/weather', {
      arriveAt: tripData.arriveAt,
      departDate: tripData.departDate,
      returnDate: tripData.returnDate,
    }, {
      serviceName: 'weather',
      errorMessage: 'Failed to fetch weather data',
    }),
    'weather'
  );
}
