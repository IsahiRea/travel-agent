/**
 * Hotel API Module
 * Handles all hotel-related API calls using Amadeus API
 * API Documentation: https://developers.amadeus.com/
 */

/**
 * Get Amadeus OAuth access token
 * @returns {Promise<string>} Access token
 */
async function getAmadeusAccessToken() {
    const apiKey = import.meta.env.VITE_AMADEUS_API_KEY;
    const apiSecret = import.meta.env.VITE_AMADEUS_API_SECRET;

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', apiKey);
    params.append('client_secret', apiSecret);

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
 * Get IATA city code from city name using Amadeus Airport & City Search API
 * @param {string} cityName - City name or city code
 * @param {string} accessToken - Amadeus API access token
 * @returns {Promise<string>} IATA city code
 */
async function getCityCode(cityName, accessToken) {
    try {
        const normalized = cityName.trim();

        // If it's already a 3-letter IATA code, return as-is
        if (/^[A-Z]{3}$/i.test(normalized)) {
            return normalized.toUpperCase();
        }

        // Call Amadeus Airport & City Search API
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
 * @param {string} cityName - City name
 * @returns {string} IATA city code
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
 * Fetch hotel data for a trip destination
 * @param {Object} tripData - Trip planning data
 * @param {string} tripData.arriveAt - Destination city
 * @param {string} tripData.departDate - Check-in date (YYYY-MM-DD)
 * @param {string} tripData.returnDate - Check-out date (YYYY-MM-DD)
 * @param {number} tripData.travelers - Number of guests
 * @returns {Promise<Object>} Hotel search results
 */
export async function fetchHotelData(tripData) {
    try {
        // Check if API credentials are configured
        if (!import.meta.env.VITE_AMADEUS_API_KEY || !import.meta.env.VITE_AMADEUS_API_SECRET) {
            console.warn('Amadeus API credentials not configured. Using mock data.');
            return getMockHotelData(tripData);
        }

        // Get access token
        const accessToken = await getAmadeusAccessToken();

        // Get city code for destination
        const cityCode = await getCityCode(tripData.arriveAt, accessToken);

        console.log('Searching hotels in city:', cityCode);

        // Step 1: Get list of hotels in the city
        const hotelsListResponse = await fetch(
            `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
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
                return {
                    success: true,
                    hotels: [],
                    message: 'No hotels found in this destination.'
                };
            }
            throw new Error(`Hotel List API error: ${hotelsListResponse.status}`);
        }

        const hotelsListData = await hotelsListResponse.json();

        // Handle empty hotel list
        if (!hotelsListData.data || hotelsListData.data.length === 0) {
            return {
                success: true,
                hotels: [],
                message: 'No hotels found in this destination. Try a different city.'
            };
        }

        // Get first 5 hotel IDs for offers search
        const hotelIds = hotelsListData.data.slice(0, 5).map(hotel => hotel.hotelId).join(',');

        console.log('Searching hotel offers for hotels:', hotelIds);

        // Step 2: Search for hotel offers with check-in/check-out dates
        const params = new URLSearchParams({
            hotelIds: hotelIds,
            adults: tripData.travelers.toString(),
            checkInDate: tripData.departDate,
            checkOutDate: tripData.returnDate,
            roomQuantity: '1',
            currency: 'USD',
            bestRateOnly: 'true'
        });

        const offersResponse = await fetch(
            `https://test.api.amadeus.com/v3/shopping/hotel-offers?${params}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!offersResponse.ok) {
            const errorData = await offersResponse.json().catch(() => ({}));

            if (offersResponse.status === 400) {
                // If date is too far in future or other validation error, return mock data
                console.warn('Hotel offers search failed, using mock data:', errorData?.errors?.[0]?.detail);
                return getMockHotelData(tripData);
            } else if (offersResponse.status === 404) {
                return {
                    success: true,
                    hotels: [],
                    message: 'No hotel offers available for these dates.'
                };
            }
            throw new Error(`Hotel Offers API error: ${offersResponse.status}`);
        }

        const offersData = await offersResponse.json();

        // Handle empty offers
        if (!offersData.data || offersData.data.length === 0) {
            return {
                success: true,
                hotels: [],
                message: 'No hotel offers available for the selected dates. Try different dates.'
            };
        }

        // Transform API response to application format
        const transformedHotels = offersData.data.map(hotelOffer => transformHotelOffer(hotelOffer));

        return {
            success: true,
            hotels: transformedHotels,
            count: transformedHotels.length
        };

    } catch (error) {
        console.error('Error fetching hotel data:', error);

        // Network or unknown errors - use fallback
        console.warn('Using mock hotel data due to API error');
        return getMockHotelData(tripData);
    }
}

/**
 * Transform Amadeus hotel offer to simplified format
 * @param {Object} hotelOffer - Raw hotel offer from Amadeus API
 * @returns {Object} Transformed hotel offer
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

/**
 * Generate mock hotel data for testing/fallback
 * @param {Object} tripData - Trip planning data
 * @returns {Object} Mock hotel data
 */
function getMockHotelData(tripData) {
    const mockHotels = [
        {
            id: 'mock-hotel-1',
            name: 'Grand Plaza Hotel',
            rating: 4,
            location: {
                cityCode: getFallbackCityCode(tripData.arriveAt),
                address: {
                    cityName: tripData.arriveAt
                }
            },
            price: {
                total: '150.00',
                currency: 'USD',
                formatted: '$150.00',
                perNight: '150.00'
            },
            room: {
                type: 'DELUXE',
                typeEstimated: 'DELUXE',
                description: 'Deluxe Room with City View'
            },
            amenities: ['WIFI', 'PARKING', 'RESTAURANT', 'ROOM_SERVICE'],
            checkIn: tripData.departDate,
            checkOut: tripData.returnDate,
            guests: tripData.travelers
        },
        {
            id: 'mock-hotel-2',
            name: 'Boutique Inn & Suites',
            rating: 5,
            location: {
                cityCode: getFallbackCityCode(tripData.arriveAt),
                address: {
                    cityName: tripData.arriveAt
                }
            },
            price: {
                total: '220.00',
                currency: 'USD',
                formatted: '$220.00',
                perNight: '220.00'
            },
            room: {
                type: 'SUITE',
                typeEstimated: 'SUITE',
                description: 'Executive Suite with Premium Amenities'
            },
            amenities: ['WIFI', 'PARKING', 'RESTAURANT', 'ROOM_SERVICE', 'SPA', 'GYM'],
            checkIn: tripData.departDate,
            checkOut: tripData.returnDate,
            guests: tripData.travelers
        },
        {
            id: 'mock-hotel-3',
            name: 'City Center Lodge',
            rating: 3,
            location: {
                cityCode: getFallbackCityCode(tripData.arriveAt),
                address: {
                    cityName: tripData.arriveAt
                }
            },
            price: {
                total: '89.00',
                currency: 'USD',
                formatted: '$89.00',
                perNight: '89.00'
            },
            room: {
                type: 'STANDARD',
                typeEstimated: 'STANDARD',
                description: 'Standard Room'
            },
            amenities: ['WIFI', 'PARKING'],
            checkIn: tripData.departDate,
            checkOut: tripData.returnDate,
            guests: tripData.travelers
        }
    ];

    return {
        success: true,
        hotels: mockHotels,
        count: mockHotels.length,
        isMock: true,
        message: 'Using sample hotel data. API may have date restrictions or rate limits.'
    };
}
