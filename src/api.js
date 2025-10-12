/**
 * API Module - Central Entry Point
 * This file serves as the single entry point for all API access across the project.
 * It imports and re-exports all API functions from the apis/ folder.
 */

// Weather API
export { fetchWeatherData } from './apis/weatherApi.js';

// Flight API
export { fetchFlightData } from './apis/flightApi.js';

// Hotel API
export { fetchHotelData } from './apis/hotelApi.js';

// Trip Plan API
export { generateTripPlan } from './apis/tripPlanApi.js';
