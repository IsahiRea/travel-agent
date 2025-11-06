/**
 * Flight API Module (Backend Version)
 * Calls serverless functions instead of external APIs directly
 */

/**
 * Fetch flight data from backend serverless function
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
        console.log('Fetching flights from backend API...');

        const response = await fetch('/api/flights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                origin: tripData.departFrom,
                destination: tripData.arriveAt,
                departureDate: tripData.departDate,
                returnDate: tripData.returnDate,
                adults: tripData.travelers
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Backend API error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch flight data');
        }

        // Transform backend response to match existing format
        const transformedFlights = result.data.data.map(offer => transformFlightOffer(offer));

        return {
            success: true,
            flights: transformedFlights,
            count: transformedFlights.length,
            codes: result.codes
        };

    } catch (error) {
        console.error('Error fetching flight data:', error);
        return {
            success: false,
            error: error.message,
            flights: [],
            message: 'Unable to fetch flight data. Please try again.'
        };
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
 * Search for city/airport suggestions for autocomplete
 * Note: This still uses the old frontend approach with caching
 * For production, consider creating a backend endpoint for this too
 * @param {string} keyword - Search keyword (city or airport name)
 * @returns {Promise<Array>} Array of location suggestions
 */
export async function searchCityAirports(keyword) {
    // For now, keep the existing autocomplete functionality
    // This uses cached data and could be migrated to backend later
    const { searchCityAirports: oldSearch } = await import('./flightApi.js');
    return oldSearch(keyword);
}
