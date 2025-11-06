/**
 * Vercel Serverless Function for Flight Search
 * Handles Amadeus API authentication and flight search
 */

// In-memory token cache for the serverless function
let tokenCache = {
  token: null,
  expiresAt: null
};

/**
 * Get or refresh Amadeus access token
 */
async function getAmadeusToken() {
  // Check if we have a valid cached token
  if (tokenCache.token && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_API_KEY,
      client_secret: process.env.AMADEUS_API_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate with Amadeus API');
  }

  const data = await response.json();

  // Cache token (subtract 60 seconds for safety margin)
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return data.access_token;
}

/**
 * Get airport codes for a city
 */
async function getAirportCodes(cityName, token) {
  const response = await fetch(
    `https://test.api.amadeus.com/v1/reference-data/locations?keyword=${encodeURIComponent(cityName)}&subType=CITY,AIRPORT`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch airport codes for ${cityName}`);
  }

  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    throw new Error(`No airports found for ${cityName}`);
  }

  return data.data[0].iataCode;
}

/**
 * Search for flights
 */
async function searchFlights(params, token) {
  const { originCode, destinationCode, departureDate, returnDate, adults } = params;

  const queryParams = new URLSearchParams({
    originLocationCode: originCode,
    destinationLocationCode: destinationCode,
    departureDate,
    returnDate,
    adults: adults.toString(),
    currencyCode: 'USD',
    max: '5',
  });

  const response = await fetch(
    `https://test.api.amadeus.com/v2/shopping/flight-offers?${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch flight offers');
  }

  return await response.json();
}

/**
 * Main handler for Vercel serverless function
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { origin, destination, departureDate, returnDate, adults } = req.body;

    // Validate required fields
    if (!origin || !destination || !departureDate || !returnDate || !adults) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get authentication token
    const token = await getAmadeusToken();

    // Get airport codes
    const originCode = await getAirportCodes(origin, token);
    const destinationCode = await getAirportCodes(destination, token);

    // Search for flights
    const flightData = await searchFlights({
      originCode,
      destinationCode,
      departureDate,
      returnDate,
      adults
    }, token);

    // Return results
    return res.status(200).json({
      success: true,
      data: flightData,
      codes: { originCode, destinationCode }
    });

  } catch (error) {
    console.error('Flight API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch flight data'
    });
  }
}
