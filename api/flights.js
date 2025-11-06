/**
 * Vercel Serverless Function for Flight Search
 * Handles Amadeus API with secure credentials
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
      client_id: process.env.AMADEUS_API_KEY,      // SECURE
      client_secret: process.env.AMADEUS_API_SECRET, // SECURE
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

/**
 * Get IATA airport code from city name
 */
async function getAirportCode(cityName, accessToken) {
  try {
    const normalized = cityName.trim();

    // If it's already a 3-letter IATA code, return as-is
    if (/^[A-Z]{3}$/i.test(normalized)) {
      return normalized.toUpperCase();
    }

    // Fetch from Amadeus API
    const params = new URLSearchParams({
      subType: 'AIRPORT,CITY',
      keyword: normalized
    });

    const response = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.warn(`Airport search failed for "${cityName}". Using fallback.`);
      return getFallbackAirportCode(cityName);
    }

    const data = await response.json();

    // Handle empty results
    if (!data.data || data.data.length === 0) {
      console.warn(`No airports found for "${cityName}". Using fallback.`);
      return getFallbackAirportCode(cityName);
    }

    // Prioritize AIRPORT subType, fall back to CITY
    const airport = data.data.find(loc => loc.subType === 'AIRPORT') || data.data[0];

    if (!airport.iataCode) {
      console.warn(`No IATA code found for "${cityName}". Using fallback.`);
      return getFallbackAirportCode(cityName);
    }

    console.log(`Resolved "${cityName}" to airport code: ${airport.iataCode}`);
    return airport.iataCode;

  } catch (error) {
    console.error(`Error fetching airport code for "${cityName}":`, error.message);
    return getFallbackAirportCode(cityName);
  }
}

/**
 * Fallback function to get airport code from hardcoded mapping
 */
function getFallbackAirportCode(cityName) {
  const cityToAirport = {
    'new york': 'JFK',
    'new york city': 'JFK',
    'nyc': 'JFK',
    'paris': 'CDG',
    'london': 'LHR',
    'tokyo': 'NRT',
    'los angeles': 'LAX',
    'chicago': 'ORD',
    'san francisco': 'SFO',
    'miami': 'MIA',
    'seattle': 'SEA',
    'boston': 'BOS',
    'washington': 'IAD',
    'atlanta': 'ATL',
    'dallas': 'DFW',
    'houston': 'IAH',
    'las vegas': 'LAS',
    'denver': 'DEN',
    'phoenix': 'PHX',
    'orlando': 'MCO',
    'barcelona': 'BCN',
    'madrid': 'MAD',
    'rome': 'FCO',
    'amsterdam': 'AMS',
    'frankfurt': 'FRA',
    'munich': 'MUC',
    'dubai': 'DXB',
    'singapore': 'SIN',
    'hong kong': 'HKG',
    'sydney': 'SYD',
    'melbourne': 'MEL',
    'toronto': 'YYZ',
    'vancouver': 'YVR',
    'mexico city': 'MEX',
    'sao paulo': 'GRU',
    'buenos aires': 'EZE',
    'johannesburg': 'JNB',
    'cairo': 'CAI',
    'istanbul': 'IST',
    'moscow': 'SVO',
    'bangkok': 'BKK',
    'mumbai': 'BOM',
    'delhi': 'DEL',
    'beijing': 'PEK',
    'shanghai': 'PVG',
    'seoul': 'ICN'
  };

  const normalized = cityName.toLowerCase().trim();
  return cityToAirport[normalized] || 'JFK';
}

/**
 * Transform Amadeus flight offer to simplified format
 */
function transformFlightOffer(offer) {
  const itineraries = offer.itineraries || [];
  const price = offer.price || {};
  const firstItinerary = itineraries[0] || {};
  const segments = firstItinerary.segments || [];
  const firstSegment = segments[0] || {};
  const lastSegment = segments[segments.length - 1] || {};

  return {
    id: offer.id,
    price: {
      total: price.total,
      currency: price.currency || 'USD',
      formatted: `$${parseFloat(price.total).toFixed(2)}`
    },
    outbound: {
      departure: {
        airport: firstSegment.departure?.iataCode,
        time: firstSegment.departure?.at,
        terminal: firstSegment.departure?.terminal
      },
      arrival: {
        airport: lastSegment.arrival?.iataCode,
        time: lastSegment.arrival?.at,
        terminal: lastSegment.arrival?.terminal
      },
      duration: firstItinerary.duration,
      stops: segments.length - 1,
      segments: segments.map(seg => ({
        airline: seg.carrierCode,
        flightNumber: `${seg.carrierCode}${seg.number}`,
        aircraft: seg.aircraft?.code,
        departure: seg.departure,
        arrival: seg.arrival
      }))
    },
    // Handle return flight if exists
    return: itineraries[1] ? transformItinerary(itineraries[1]) : null,
    airline: firstSegment.carrierCode,
    bookingClass: segments[0]?.cabin || 'ECONOMY',
    validatingAirline: offer.validatingAirlineCodes?.[0]
  };
}

/**
 * Helper to transform itinerary
 */
function transformItinerary(itinerary) {
  const segments = itinerary.segments || [];
  const firstSegment = segments[0] || {};
  const lastSegment = segments[segments.length - 1] || {};

  return {
    departure: {
      airport: firstSegment.departure?.iataCode,
      time: firstSegment.departure?.at,
      terminal: firstSegment.departure?.terminal
    },
    arrival: {
      airport: lastSegment.arrival?.iataCode,
      time: lastSegment.arrival?.at,
      terminal: lastSegment.arrival?.terminal
    },
    duration: itinerary.duration,
    stops: segments.length - 1
  };
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { departFrom, arriveAt, departDate, returnDate, travelers } = req.body;

    // Validate
    if (!departFrom || !arriveAt || !departDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get secure token
    const token = await getAmadeusToken();

    // Convert city names to IATA airport codes
    const originCode = await getAirportCode(departFrom, token);
    const destinationCode = await getAirportCode(arriveAt, token);

    // Build request URL with query parameters
    const params = new URLSearchParams({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate: departDate,
      adults: (travelers || 1).toString(),
      max: '5',
      currencyCode: 'USD'
    });

    // Add return date for round trip
    if (returnDate) {
      params.append('returnDate', returnDate);
    }

    console.log('Searching flights with params:', Object.fromEntries(params));

    // Call Amadeus API
    const response = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error('Invalid Amadeus API credentials.');
      } else if (response.status === 400) {
        throw new Error(`Invalid request: ${errorData?.errors?.[0]?.detail || 'Please check your input parameters.'}`);
      } else if (response.status === 404) {
        return res.status(200).json({
          success: true,
          flights: [],
          message: 'No flights found. Please try different search criteria.'
        });
      } else if (response.status === 500) {
        throw new Error('Amadeus API service error. Please try again later.');
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle empty results
    if (!data.data || data.data.length === 0) {
      return res.status(200).json({
        success: true,
        flights: [],
        message: 'No flights found for the selected criteria. Try adjusting your dates or destinations.'
      });
    }

    // Transform API response to application format
    const transformedFlights = data.data.map(offer => transformFlightOffer(offer));

    return res.status(200).json({
      success: true,
      data: {
        flights: transformedFlights,
        count: transformedFlights.length
      }
    });

  } catch (error) {
    console.error('Flight API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch flights'
    });
  }
}
