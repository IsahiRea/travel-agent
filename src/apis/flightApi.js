/**
 * Flight API Module
 * Handles all flight-related API calls using Amadeus API
 * API Documentation: https://developers.amadeus.com/
 */

import { getAmadeusAccessToken } from '../utils/tokenCache.js';
import { getCachedAirportCode, cacheAirportCode } from '../utils/cache/airportCache.js';

/**
 * Fetch flight data from Amadeus API
 * @param {Object} tripData - Trip planning data
 * @param {string} tripData.departFrom - Departure city/airport
 * @param {string} tripData.arriveAt - Arrival city/airport
 * @param {string} tripData.departDate - Departure date (YYYY-MM-DD)
 * @param {string} tripData.returnDate - Return date (YYYY-MM-DD)
 * @param {number} tripData.travelers - Number of adult travelers
 * @returns {Promise<Array>} Array of flight offers
 */
export async function fetchFlightData(tripData) {
    try {
        // Check if API credentials are configured
        if (!import.meta.env.VITE_AMADEUS_API_KEY || !import.meta.env.VITE_AMADEUS_API_SECRET) {
            console.warn('Amadeus API credentials not configured. Using mock data.');
            return getMockFlightData(tripData);
        }

        // Get access token
        const accessToken = await getAmadeusAccessToken();

        // Convert city names to IATA airport codes
        const originCode = await getAirportCode(tripData.departFrom, accessToken);
        const destinationCode = await getAirportCode(tripData.arriveAt, accessToken);

        // Build request URL with query parameters
        const params = new URLSearchParams({
            originLocationCode: originCode,
            destinationLocationCode: destinationCode,
            departureDate: tripData.departDate,
            adults: tripData.travelers.toString(),
            max: '5',  // Reduced from 10 for faster API response
            currencyCode: 'USD'
        });

        // Add return date for round trip
        if (tripData.returnDate) {
            params.append('returnDate', tripData.returnDate);
        }

        console.log('Searching flights with params:', Object.fromEntries(params));

        // Call Amadeus Flight Offers Search API
        const response = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 401) {
                throw new Error('Invalid Amadeus API credentials. Please check your API key and secret.');
            } else if (response.status === 400) {
                throw new Error(`Invalid request: ${errorData?.errors?.[0]?.detail || 'Please check your input parameters.'}`);
            } else if (response.status === 404) {
                return {
                    success: true,
                    flights: [],
                    message: 'No flights found. Please try different search criteria.'
                };
            } else if (response.status === 500) {
                throw new Error('Amadeus API service error. Please try again later.');
            }
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Handle empty results
        if (!data.data || data.data.length === 0) {
            return {
                success: true,
                flights: [],
                message: 'No flights found for the selected criteria. Try adjusting your dates or destinations.'
            };
        }

        // Transform API response to application format
        const transformedFlights = data.data.map(offer => transformFlightOffer(offer));

        return {
            success: true,
            flights: transformedFlights,
            count: transformedFlights.length
        };

    } catch (error) {
        console.error('Error fetching flight data:', error);

        // Network or unknown errors - use fallback
        console.warn('Using mock flight data due to API error');
        return getMockFlightData(tripData);
    }
}

/**
 * Transform Amadeus flight offer to simplified format
 * @param {Object} offer - Raw flight offer from Amadeus API
 * @returns {Object} Transformed flight offer
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
 * @param {Object} itinerary - Flight itinerary
 * @returns {Object} Transformed itinerary
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

/**
 * Get IATA airport code from city name with IndexedDB caching
 * @param {string} cityName - City name or airport code
 * @param {string} accessToken - Amadeus API access token
 * @returns {Promise<string>} IATA airport code
 */
async function getAirportCode(cityName, accessToken) {
    try {
        const normalized = cityName.trim();

        // If it's already a 3-letter IATA code, return as-is
        if (/^[A-Z]{3}$/i.test(normalized)) {
            return normalized.toUpperCase();
        }

        // 1. Try IndexedDB cache first (instant lookup)
        const cachedCode = await getCachedAirportCode(normalized);
        if (cachedCode) {
            return cachedCode;
        }

        // 2. Cache miss - fetch from Amadeus API
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
            const fallbackCode = getFallbackAirportCode(cityName);
            // Cache fallback result to avoid repeated API failures
            await cacheAirportCode(normalized, fallbackCode);
            return fallbackCode;
        }

        const data = await response.json();

        // Handle empty results
        if (!data.data || data.data.length === 0) {
            console.warn(`No airports found for "${cityName}". Using fallback.`);
            const fallbackCode = getFallbackAirportCode(cityName);
            await cacheAirportCode(normalized, fallbackCode);
            return fallbackCode;
        }

        // Prioritize AIRPORT subType, fall back to CITY
        const airport = data.data.find(loc => loc.subType === 'AIRPORT') || data.data[0];

        if (!airport.iataCode) {
            console.warn(`No IATA code found for "${cityName}". Using fallback.`);
            const fallbackCode = getFallbackAirportCode(cityName);
            await cacheAirportCode(normalized, fallbackCode);
            return fallbackCode;
        }

        console.log(`Resolved "${cityName}" to airport code: ${airport.iataCode}`);

        // 3. Cache the successful result for future use
        await cacheAirportCode(normalized, airport.iataCode);

        return airport.iataCode;

    } catch (error) {
        console.error(`Error fetching airport code for "${cityName}":`, error.message);
        return getFallbackAirportCode(cityName);
    }
}

/**
 * Search for city/airport suggestions for autocomplete
 * @param {string} keyword - Search keyword (city or airport name)
 * @returns {Promise<Array>} Array of location suggestions
 */
export async function searchCityAirports(keyword) {
    try {
        const normalized = keyword.trim();

        // Don't search for very short queries
        if (normalized.length < 2) {
            return [];
        }

        // Get access token
        const accessToken = await getAmadeusAccessToken();

        // Search using Amadeus Location API
        const params = new URLSearchParams({
            subType: 'AIRPORT,CITY',
            keyword: normalized,
            'page[limit]': '10'
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
            console.warn(`Location search failed for "${keyword}"`);
            return [];
        }

        const data = await response.json();

        // Handle empty results
        if (!data.data || data.data.length === 0) {
            return [];
        }

        // Transform results to simpler format
        return data.data.map(location => ({
            cityName: location.address?.cityName || location.name,
            iataCode: location.iataCode,
            countryCode: location.address?.countryCode,
            subType: location.subType,
            name: location.name
        }));

    } catch (error) {
        console.error('Error searching locations:', error);
        return [];
    }
}

/**
 * Fallback function to get airport code from hardcoded mapping
 * @param {string} cityName - City name
 * @returns {string} IATA airport code
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
 * Generate mock flight data for testing/fallback
 * @param {Object} tripData - Trip planning data
 * @returns {Object} Mock flight data
 */
function getMockFlightData(tripData) {
    const mockFlights = [
        {
            id: 'mock-1',
            airline: 'Delta Airlines',
            flightNumber: 'DL123',
            price: {
                total: '650.00',
                currency: 'USD',
                formatted: '$650.00'
            },
            outbound: {
                departure: {
                    airport: 'JFK',
                    time: new Date(tripData.departDate + 'T10:00:00').toISOString(),
                    terminal: '4'
                },
                arrival: {
                    airport: 'CDG',
                    time: new Date(tripData.departDate + 'T22:00:00').toISOString(),
                    terminal: '2E'
                },
                duration: 'PT8H',
                stops: 0
            },
            bookingClass: 'ECONOMY'
        },
        {
            id: 'mock-2',
            airline: 'Air France',
            flightNumber: 'AF007',
            price: {
                total: '725.00',
                currency: 'USD',
                formatted: '$725.00'
            },
            outbound: {
                departure: {
                    airport: 'JFK',
                    time: new Date(tripData.departDate + 'T15:30:00').toISOString(),
                    terminal: '1'
                },
                arrival: {
                    airport: 'CDG',
                    time: new Date(tripData.departDate + 'T03:30:00').toISOString(),
                    terminal: '2F'
                },
                duration: 'PT7H',
                stops: 0
            },
            bookingClass: 'ECONOMY'
        }
    ];

    return {
        success: true,
        flights: mockFlights,
        count: mockFlights.length,
        isMock: true,
        message: 'Using sample flight data. Configure Amadeus API credentials for live data.'
    };
}
