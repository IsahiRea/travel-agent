/**
 * Hotel API Module (Secure Backend Version)
 * Handles all hotel-related API calls via secure backend
 * API Documentation: https://developers.amadeus.com/
 */

/**
 * Fetch hotel data from secure backend endpoint
 * @param {Object} tripData - Trip planning data
 * @param {string} tripData.arriveAt - Destination city
 * @param {string} tripData.departDate - Check-in date (YYYY-MM-DD)
 * @param {string} tripData.returnDate - Check-out date (YYYY-MM-DD)
 * @param {number} tripData.travelers - Number of guests
 * @returns {Promise<Object>} Hotel search results
 */
export async function fetchHotelData(tripData) {
    try {
        console.log('Calling secure backend for hotels...');

        // ✅ NO API KEY in frontend code - calling secure backend
        const response = await fetch('/api/hotels', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
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
            throw new Error(result.error || 'Failed to fetch hotels');
        }

        return result.data;

    } catch (error) {
        console.error('Error fetching hotel data:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
