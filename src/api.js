/**
 * API Module - Central Entry Point
 * This file serves as the single entry point for all API access across the project.
 * It imports and re-exports all API functions from the secure backend API clients.
 */

// Weather API - Secure Backend Version
export { fetchWeatherData } from './apis/weatherApi.backend.js';

// Flight API - Secure Backend Version
export { fetchFlightData, searchCityAirports } from './apis/flightApi.backend.js';

// Hotel API - Secure Backend Version
export { fetchHotelData } from './apis/hotelApi.backend.js';

// Trip Plan API - Secure Backend Version (Non-Streaming)
export { generateTripPlan } from './apis/tripPlanApi.backend.js';

// Unsplash API - Secure Backend Version
export { searchDestinationPhotos, triggerUnsplashDownload, getPhotoById } from './apis/unsplashApi.backend.js';
