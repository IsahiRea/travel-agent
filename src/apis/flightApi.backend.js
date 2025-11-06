/**
 * Flight API Module (Secure Backend Version)
 * Handles all flight-related API calls via secure backend
 * API Documentation: https://developers.amadeus.com/
 */

/**
 * Fetch flight data from secure backend endpoint
 * @param {Object} tripData - Trip planning data
 * @param {string} tripData.departFrom - Departure city/airport
 * @param {string} tripData.arriveAt - Arrival city/airport
 * @param {string} tripData.departDate - Departure date (YYYY-MM-DD)
 * @param {string} tripData.returnDate - Return date (YYYY-MM-DD)
 * @param {number} tripData.travelers - Number of adult travelers
 * @returns {Promise<Object>} Flight search results
 */
export async function fetchFlightData(tripData) {
    try {
        console.log('Calling secure backend for flights...');

        // ✅ NO API KEY in frontend code - calling secure backend
        const response = await fetch('/api/flights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                departFrom: tripData.departFrom,
                arriveAt: tripData.arriveAt,
                departDate: tripData.departDate,
                returnDate: tripData.returnDate,
                travelers: tripData.travelers
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Backend error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch flights');
        }

        return result.data;

    } catch (error) {
        console.error('Error fetching flight data:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Search for city/airport suggestions for autocomplete
 * Note: This function is not yet implemented in the backend
 * For now, it returns an empty array
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

        // TODO: Implement backend endpoint for city/airport search
        console.warn('City/airport search not yet implemented in secure backend');
        return [];

    } catch (error) {
        console.error('Error searching locations:', error);
        return [];
    }
}
