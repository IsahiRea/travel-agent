/**
 * API Configuration
 * Note: Amadeus API is now called directly via fetch() in the flight API module
 * to avoid browser compatibility issues with the amadeus-node SDK
 *
 * OpenAI SDK is now dynamically imported only when needed to reduce initial bundle size
 */

/**
 * Get OpenAI client instance (lazy loaded)
 * @returns {Promise<OpenAI|null>} OpenAI client or null if not configured
 */
export async function getOpenAIClient() {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    return null;
  }

  // Dynamic import - only loads OpenAI SDK when this function is called
  const { default: OpenAI } = await import('openai');

  return new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });
}

// Centralized configuration object
const config = {
  amadeus: {
    apiKey: import.meta.env.VITE_AMADEUS_API_KEY,
    apiSecret: import.meta.env.VITE_AMADEUS_API_SECRET,
    baseUrl: 'https://test.api.amadeus.com'
  },
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY
  },
  openweather: {
    apiKey: import.meta.env.VITE_OPENWEATHER_API_KEY,
    baseUrl: 'https://api.openweathermap.org/data/2.5'
  },
  unsplash: {
    accessKey: import.meta.env.VITE_UNSPLASH_ACCESS_KEY,
    baseUrl: 'https://api.unsplash.com'
  }
};

export default config;