/**
 * Vercel Serverless Function for City/Airport Autocomplete Search
 * Provides autocomplete suggestions using Amadeus API
 */

// In-memory token cache
let tokenCache = {
  token: null,
  expiresAt: null
};

async function getAmadeusToken() {
  // Check cache
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  // Get new token - ✅ Credentials SECURE on server
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
    throw new Error('Failed to authenticate with Amadeus');
  }

  const data = await response.json();

  // Cache token
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return data.access_token;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { keyword } = req.query;

    // Validate
    if (!keyword || keyword.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Get secure token
    const token = await getAmadeusToken();

    // Search for cities/airports using Amadeus Location API
    const params = new URLSearchParams({
      subType: 'AIRPORT,CITY',
      keyword: keyword.trim(),
      'page[limit]': '10'
    });

    const response = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Amadeus location search failed:', response.status);
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const data = await response.json();

    // Transform results to simpler format
    const suggestions = (data.data || []).map(location => ({
      iataCode: location.iataCode,
      cityName: location.address?.cityName || location.name,
      countryCode: location.address?.countryCode,
      name: location.name,
      subType: location.subType
    }));

    return res.status(200).json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('City Search API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to search cities'
    });
  }
}
