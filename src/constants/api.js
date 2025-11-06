/**
 * API Configuration Constants
 * Centralized API endpoints, timeouts, and retry configuration
 */

// API Timeout Configuration (in milliseconds)
export const API_TIMEOUTS = {
  DEFAULT: 10000,        // 10 seconds
  LONG: 30000,          // 30 seconds for complex operations
  STREAMING: 60000      // 60 seconds for streaming operations
};

// API Retry Configuration
export const API_RETRY = {
  MAX_ATTEMPTS: 3,
  DELAY: 1000,          // 1 second
  BACKOFF_MULTIPLIER: 2 // Exponential backoff
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Amadeus API Constants
export const AMADEUS = {
  BASE_URL: 'https://test.api.amadeus.com',
  ENDPOINTS: {
    TOKEN: '/v1/security/oauth2/token',
    CITY_SEARCH: '/v1/reference-data/locations/cities',
    FLIGHT_OFFERS: '/v2/shopping/flight-offers',
    HOTEL_SEARCH: '/v1/reference-data/locations/hotels/by-city'
  },
  MAX_RESULTS: {
    FLIGHTS: 10,
    HOTELS: 20,
    CITIES: 5
  }
};

// OpenWeather API Constants
export const OPENWEATHER = {
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  ENDPOINTS: {
    FORECAST: '/forecast'
  },
  UNITS: 'metric'
};

// Unsplash API Constants
export const UNSPLASH = {
  BASE_URL: 'https://api.unsplash.com',
  ENDPOINTS: {
    SEARCH_PHOTOS: '/search/photos',
    TRACK_DOWNLOAD: '/photos/:id/download'
  },
  MAX_RESULTS: 30,
  DEFAULT_QUERY: 'travel destination'
};

// OpenAI API Constants
export const OPENAI = {
  MODEL: 'gpt-4o-mini',
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.7,
  STREAMING: {
    ENABLED: true,
    CHUNK_SIZE: 1024
  }
};

// Cache Configuration
export const CACHE = {
  DB_NAME: 'travel-agent-cache',
  VERSION: 2,
  STORES: {
    AIRPORT_CODES: 'airport-codes',
    CITY_COORDINATES: 'city-coordinates'
  },
  TTL: {
    AIRPORT_CODES: 30 * 24 * 60 * 60 * 1000,     // 30 days
    CITY_COORDINATES: 30 * 24 * 60 * 60 * 1000,  // 30 days
    TOKEN: 29 * 60 * 1000                         // 29 minutes (tokens expire at 30)
  }
};
