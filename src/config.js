/**
 * API Configuration (Secure Backend Version)
 *
 * ✅ SECURE: All API keys are now stored on the backend
 * ✅ NO API KEYS are exposed to the browser
 * ✅ Frontend calls secure backend endpoints at /api/*
 *
 * This configuration file is now minimal since all API calls
 * are proxied through the secure backend.
 */

// Centralized configuration object (frontend-safe)
const config = {
  // Backend API endpoints (no API keys needed in frontend)
  api: {
    baseUrl: '/api',
    endpoints: {
      flights: '/api/flights',
      hotels: '/api/hotels',
      weather: '/api/weather',
      tripPlan: '/api/trip-plan',
      tripPlanStream: '/api/trip-plan-stream',
      unsplash: '/api/unsplash'
    }
  }
};

export default config;