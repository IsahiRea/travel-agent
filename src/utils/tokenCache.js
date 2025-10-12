/**
 * Token Cache Module
 * Provides centralized OAuth token management with caching
 * Reduces redundant API calls by reusing valid tokens
 */

// Cache duration: configurable via environment variable
// Default: 29 minutes (1740000ms) - Amadeus tokens expire in 30 minutes
const TOKEN_CACHE_DURATION = parseInt(
    import.meta.env.VITE_TOKEN_CACHE_DURATION || '1740000',
    10
);

// Cache storage key
const CACHE_KEY = 'amadeus_token_cache';

/**
 * Token cache structure
 * @typedef {Object} TokenCache
 * @property {string} token - The access token
 * @property {number} timestamp - Unix timestamp when token was cached
 * @property {number} expiresAt - Unix timestamp when token expires
 */

/**
 * Get cached token from sessionStorage
 * @returns {TokenCache|null} Cached token or null if not found/expired
 */
function getCachedToken() {
    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (!cached) {
            return null;
        }

        const tokenCache = JSON.parse(cached);
        const now = Date.now();

        // Check if token is still valid
        if (now < tokenCache.expiresAt) {
            console.log('Using cached Amadeus token (expires in', Math.round((tokenCache.expiresAt - now) / 1000), 'seconds)');
            return tokenCache;
        }

        // Token expired, remove from cache
        console.log('Cached token expired, fetching new token');
        sessionStorage.removeItem(CACHE_KEY);
        return null;

    } catch (error) {
        console.error('Error reading token cache:', error);
        return null;
    }
}

/**
 * Store token in sessionStorage
 * @param {string} token - Access token to cache
 */
function cacheToken(token) {
    try {
        const now = Date.now();
        const tokenCache = {
            token: token,
            timestamp: now,
            expiresAt: now + TOKEN_CACHE_DURATION
        };

        sessionStorage.setItem(CACHE_KEY, JSON.stringify(tokenCache));
        console.log('Cached new Amadeus token (valid for 29 minutes)');

    } catch (error) {
        console.error('Error caching token:', error);
        // Non-critical error, continue without caching
    }
}

/**
 * Clear cached token (useful for testing or error recovery)
 */
export function clearTokenCache() {
    try {
        sessionStorage.removeItem(CACHE_KEY);
        console.log('Token cache cleared');
    } catch (error) {
        console.error('Error clearing token cache:', error);
    }
}

/**
 * Request new OAuth token from Amadeus API
 * @returns {Promise<string>} Access token
 * @throws {Error} If authentication fails
 */
async function requestNewToken() {
    const apiKey = import.meta.env.VITE_AMADEUS_API_KEY;
    const apiSecret = import.meta.env.VITE_AMADEUS_API_SECRET;

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', apiKey);
    params.append('client_secret', apiSecret);

    console.log('Requesting new Amadeus access token...');

    const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    });

    if (!response.ok) {
        throw new Error('Failed to authenticate with Amadeus API');
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Get Amadeus OAuth access token (cached or new)
 * This is the main function that should be used by other modules
 *
 * @returns {Promise<string>} Valid access token
 * @throws {Error} If authentication fails
 */
export async function getAmadeusAccessToken() {
    // Try to get cached token first
    const cached = getCachedToken();
    if (cached) {
        return cached.token;
    }

    // No valid cached token, request new one
    const newToken = await requestNewToken();

    // Cache the new token
    cacheToken(newToken);

    return newToken;
}

/**
 * Get token cache statistics
 * @returns {Object} Token cache statistics
 */
export function getTokenCacheStats() {
    const cached = getCachedToken();

    if (!cached) {
        return {
            hasToken: false,
            expiresIn: 0,
            age: 0,
            expiresAt: null
        };
    }

    const now = Date.now();
    return {
        hasToken: true,
        expiresIn: Math.max(0, cached.expiresAt - now), // Time until expiration (ms)
        age: now - cached.timestamp, // Time since cached (ms)
        expiresAt: cached.expiresAt // Absolute expiration timestamp
    };
}
