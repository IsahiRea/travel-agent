/**
 * API Module - Central Entry Point
 * This file serves as the single entry point for all API access across the project.
 * It imports and re-exports all API functions from the apis/ folder.
 *
 * BACKEND MODE: Using serverless functions to secure API keys
 */

// Weather API (Backend)
export { fetchWeatherData } from './apis/weatherApi.backend.js';

// Flight API (Backend)
export { fetchFlightData } from './apis/flightApi.backend.js';

// Hotel API (Backend)
export { fetchHotelData } from './apis/hotelApi.backend.js';

// Trip Plan API (Backend)
export { generateTripPlan } from './apis/tripPlanApi.backend.js';
