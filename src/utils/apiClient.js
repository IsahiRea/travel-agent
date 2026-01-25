/**
 * API Client Utility
 * Provides standardized HTTP request handling for all API modules
 * Reduces code duplication across API modules with consistent error handling
 */

// Default headers for JSON requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Parse error response safely
 * @param {Response} response - Fetch Response object
 * @returns {Promise<Object>} Parsed error data or empty object
 */
async function parseErrorResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * Make a POST request to the backend API
 * @param {string} endpoint - API endpoint path (e.g., '/api/flights')
 * @param {Object} body - Request body to send as JSON
 * @param {Object} options - Additional options
 * @param {string} options.serviceName - Name of the service for logging
 * @param {string} options.errorMessage - Custom error message for failures
 * @returns {Promise<any>} Response data on success
 * @throws {Error} On network or API errors
 */
export async function apiPost(endpoint, body, options = {}) {
  const {
    serviceName = 'API',
    errorMessage = 'Request failed',
  } = options;

  console.log(`Calling secure backend for ${serviceName}...`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new Error(errorData.error || `Backend error: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || errorMessage);
  }

  return result.data;
}

/**
 * Make a GET request to the backend API
 * @param {string} endpoint - API endpoint path with query params
 * @param {Object} options - Additional options
 * @param {string} options.serviceName - Name of the service for logging
 * @param {string} options.errorMessage - Custom error message for failures
 * @param {boolean} options.returnEmptyOnError - Return empty array instead of throwing
 * @returns {Promise<any>} Response data on success
 * @throws {Error} On network or API errors (unless returnEmptyOnError is true)
 */
export async function apiGet(endpoint, options = {}) {
  const {
    serviceName = 'API',
    errorMessage = 'Request failed',
    returnEmptyOnError = false,
  } = options;

  console.log(`Calling secure backend for ${serviceName}...`);

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });

  if (!response.ok) {
    if (returnEmptyOnError) {
      console.error(`${serviceName} failed:`, response.status);
      return [];
    }
    const errorData = await parseErrorResponse(response);
    throw new Error(errorData.error || `Backend error: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    if (returnEmptyOnError) {
      console.error(`${serviceName} error:`, result.error);
      return [];
    }
    throw new Error(result.error || errorMessage);
  }

  return result.data;
}

/**
 * Wrap an API call with standard error handling
 * Returns { success: false, error: message } on failure instead of throwing
 * @param {Function} apiCall - Async function that makes the API call
 * @param {string} serviceName - Service name for error logging
 * @returns {Promise<any>} Result data or error object
 */
export async function withErrorHandling(apiCall, serviceName) {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`Error fetching ${serviceName} data:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}
