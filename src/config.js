import OpenAI from 'openai';

/**
 * API Configuration
 * Note: Amadeus API is now called directly via fetch() in the flight API module
 * to avoid browser compatibility issues with the amadeus-node SDK
 */

/** OpenAI config */
export const openai = import.meta.env.VITE_OPENAI_API_KEY ? new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
}) : null;