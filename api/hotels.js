/**
 * Vercel Serverless Function for Hotel Search
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
 * Get IATA city code from city name
 */
async function getCityCode(cityName, accessToken) {
  try {
    const normalized = cityName.trim();

    // If it's already a 3-letter IATA code, return as-is
    if (/^[A-Z]{3}$/i.test(normalized)) {
      return normalized.toUpperCase();
    }

    // Fetch from Amadeus API
    const params = new URLSearchParams({
      subType: 'CITY',
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
      console.warn(`City search failed for "${cityName}". Using fallback.`);
      return getFallbackCityCode(cityName);
    }

    const data = await response.json();

    // Handle empty results
    if (!data.data || data.data.length === 0) {
      console.warn(`No cities found for "${cityName}". Using fallback.`);
      return getFallbackCityCode(cityName);
    }

    // Get the first city result
    const city = data.data[0];

    if (!city.iataCode) {
      console.warn(`No IATA code found for "${cityName}". Using fallback.`);
      return getFallbackCityCode(cityName);
    }

    console.log(`Resolved "${cityName}" to city code: ${city.iataCode}`);
    return city.iataCode;

  } catch (error) {
    console.error(`Error fetching city code for "${cityName}":`, error.message);
    return getFallbackCityCode(cityName);
  }
}

/**
 * Fallback function to get city code from hardcoded mapping
 */
function getFallbackCityCode(cityName) {
  const cityToCityCode = {
    'new york': 'NYC',
    'new york city': 'NYC',
    'nyc': 'NYC',
    'paris': 'PAR',
    'london': 'LON',
    'tokyo': 'TYO',
    'los angeles': 'LAX',
    'chicago': 'CHI',
    'san francisco': 'SFO',
    'miami': 'MIA',
    'seattle': 'SEA',
    'boston': 'BOS',
    'washington': 'WAS',
    'atlanta': 'ATL',
    'dallas': 'DFW',
    'houston': 'HOU',
    'las vegas': 'LAS',
    'denver': 'DEN',
    'phoenix': 'PHX',
    'orlando': 'ORL',
    'barcelona': 'BCN',
    'madrid': 'MAD',
    'rome': 'ROM',
    'amsterdam': 'AMS',
    'frankfurt': 'FRA',
    'munich': 'MUC',
    'dubai': 'DXB',
    'singapore': 'SIN',
    'hong kong': 'HKG',
    'sydney': 'SYD',
    'melbourne': 'MEL',
    'toronto': 'YTO',
    'vancouver': 'YVR',
    'mexico city': 'MEX',
    'sao paulo': 'SAO',
    'buenos aires': 'BUE',
    'johannesburg': 'JNB',
    'cairo': 'CAI',
    'istanbul': 'IST',
    'moscow': 'MOW',
    'bangkok': 'BKK',
    'mumbai': 'BOM',
    'delhi': 'DEL',
    'beijing': 'BJS',
    'shanghai': 'SHA',
    'seoul': 'SEL'
  };

  const normalized = cityName.toLowerCase().trim();
  return cityToCityCode[normalized] || 'PAR';
}

/**
 * Transform Amadeus hotel offer to simplified format
 */
function transformHotelOffer(hotelOffer) {
  const hotel = hotelOffer.hotel || {};
  const offers = hotelOffer.offers || [];
  const bestOffer = offers[0] || {};
  const price = bestOffer.price || {};
  const room = bestOffer.room || {};

  return {
    id: hotel.hotelId,
    name: hotel.name || 'Hotel',
    rating: hotel.rating || 0,
    location: {
      cityCode: hotel.cityCode,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      address: hotel.address || {}
    },
    price: {
      total: price.total,
      currency: price.currency || 'USD',
      formatted: `$${parseFloat(price.total || 0).toFixed(2)}`,
      perNight: price.variations?.average?.total || price.total
    },
    room: {
      type: room.type,
      typeEstimated: room.typeEstimated?.category || 'STANDARD',
      description: room.description?.text || 'Room',
      beds: room.description?.lang ? 1 : undefined
    },
    amenities: hotel.amenities || [],
    checkIn: bestOffer.checkInDate,
    checkOut: bestOffer.checkOutDate,
    guests: bestOffer.guests?.adults || 1
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
    const { arriveAt, departDate, returnDate, travelers } = req.body;

    // Validate
    if (!arriveAt || !departDate || !returnDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get secure token
    const token = await getAmadeusToken();

    // Get city code for destination
    const cityCode = await getCityCode(arriveAt, token);

    console.log('Searching hotels in city:', cityCode);

    // Step 1: Get list of hotels in the city
    const hotelsListResponse = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!hotelsListResponse.ok) {
      const errorData = await hotelsListResponse.json().catch(() => ({}));

      if (hotelsListResponse.status === 401) {
        throw new Error('Invalid Amadeus API credentials.');
      } else if (hotelsListResponse.status === 400) {
        throw new Error(`Invalid request: ${errorData?.errors?.[0]?.detail || 'Please check your input parameters.'}`);
      } else if (hotelsListResponse.status === 404) {
        return res.status(200).json({
          success: true,
          hotels: [],
          message: 'No hotels found in this destination.'
        });
      }
      throw new Error(`Hotel List API error: ${hotelsListResponse.status}`);
    }

    const hotelsListData = await hotelsListResponse.json();

    // Handle empty hotel list
    if (!hotelsListData.data || hotelsListData.data.length === 0) {
      return res.status(200).json({
        success: true,
        hotels: [],
        message: 'No hotels found in this destination. Try a different city.'
      });
    }

    // Get first 5 hotel IDs for offers search
    const hotelIds = hotelsListData.data.slice(0, 5).map(hotel => hotel.hotelId).join(',');

    console.log('Searching hotel offers for hotels:', hotelIds);

    // Step 2: Search for hotel offers with check-in/check-out dates
    const params = new URLSearchParams({
      hotelIds: hotelIds,
      adults: (travelers || 1).toString(),
      checkInDate: departDate,
      checkOutDate: returnDate,
      roomQuantity: '1',
      currency: 'USD',
      bestRateOnly: 'true'
    });

    const offersResponse = await fetch(
      `https://test.api.amadeus.com/v3/shopping/hotel-offers?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!offersResponse.ok) {
      const errorData = await offersResponse.json().catch(() => ({}));

      if (offersResponse.status === 400) {
        // If date is too far in future or other validation error
        console.warn('Hotel offers search failed:', errorData?.errors?.[0]?.detail);
        return res.status(200).json({
          success: true,
          hotels: [],
          message: 'No hotel offers available for these dates.'
        });
      } else if (offersResponse.status === 404) {
        return res.status(200).json({
          success: true,
          hotels: [],
          message: 'No hotel offers available for these dates.'
        });
      }
      throw new Error(`Hotel Offers API error: ${offersResponse.status}`);
    }

    const offersData = await offersResponse.json();

    // Handle empty offers
    if (!offersData.data || offersData.data.length === 0) {
      return res.status(200).json({
        success: true,
        hotels: [],
        message: 'No hotel offers available for the selected dates. Try different dates.'
      });
    }

    // Transform API response to application format
    const transformedHotels = offersData.data.map(hotelOffer => transformHotelOffer(hotelOffer));

    return res.status(200).json({
      success: true,
      data: {
        hotels: transformedHotels,
        count: transformedHotels.length
      }
    });

  } catch (error) {
    console.error('Hotel API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch hotels'
    });
  }
}
