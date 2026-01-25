/**
 * Trip Plan API Module (Secure Backend Version - Non-Streaming)
 * Handles trip plan generation via secure backend (non-streaming version)
 * API Documentation: https://platform.openai.com/docs/api-reference/chat/create
 */

import { apiPost, withErrorHandling } from '../utils/apiClient.js';

/**
 * Generate a trip plan using collected data via secure backend
 * @param {Object} data - Collected trip data
 * @param {Object} data.weather - Weather data
 * @param {Object} data.flights - Flight data
 * @param {Object} data.hotels - Hotel data
 * @param {Object} data.tripData - Original trip form data
 * @returns {Promise<Object>} Generated trip plan
 */
export async function generateTripPlan(data) {
  const { weather, flights, hotels, tripData } = data;

  return withErrorHandling(
    () => apiPost('/api/trip-plan', {
      weather,
      flights,
      hotels,
      tripData,
    }, {
      serviceName: 'trip plan (non-streaming)',
      errorMessage: 'Failed to generate trip plan',
    }),
    'trip plan'
  );
}
