/**
 * Vercel Serverless Function for Hotel Search
 * Handles Amadeus API authentication and hotel search
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
 * Get coordinates for a city using geocoding
 */
async function getCityCoordinates(cityName, token) {
  const response = await fetch(
    `https://test.api.amadeus.com/v1/reference-data/locations?keyword=${encodeURIComponent(cityName)}&subType=CITY`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch coordinates for ${cityName}`);
  }

  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    throw new Error(`No location found for ${cityName}`);
  }

  const location = data.data[0];
  return {
    latitude: location.geoCode.latitude,
    longitude: location.geoCode.longitude
  };
}

/**
 * Search for hotels
 */
async function searchHotels(params, token) {
  const { latitude, longitude, checkInDate, checkOutDate, adults, budget } = params;

  const queryParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    checkInDate,
    checkOutDate,
    adults: adults.toString(),
    radius: '20',
    radiusUnit: 'KM',
    currency: 'USD',
    priceRange: `1-${budget}`,
    bestRateOnly: 'true',
  });

  const response = await fetch(
    `https://test.api.amadeus.com/v3/shopping/hotel-offers?${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch hotel offers');
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
    const { destination, checkInDate, checkOutDate, adults, budget } = req.body;

    // Validate required fields
    if (!destination || !checkInDate || !checkOutDate || !adults || !budget) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get authentication token
    const token = await getAmadeusToken();

    // Get city coordinates
    const coordinates = await getCityCoordinates(destination, token);

    // Search for hotels
    const hotelData = await searchHotels({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      checkInDate,
      checkOutDate,
      adults,
      budget
    }, token);

    // Return results
    return res.status(200).json({
      success: true,
      data: hotelData,
      coordinates
    });

  } catch (error) {
    console.error('Hotel API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch hotel data'
    });
  }
}
