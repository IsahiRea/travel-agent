/**
 * Hotel API Module (Backend Version)
 * Calls serverless functions instead of external APIs directly
 * This version secures API keys by moving them to the backend
 */

/**
 * Fetch hotel data from backend serverless function
 * @param {Object} tripData - Trip planning data
 * @param {string} tripData.arriveAt - Destination city
 * @param {string} tripData.departDate - Check-in date (YYYY-MM-DD)
 * @param {string} tripData.returnDate - Check-out date (YYYY-MM-DD)
 * @param {number} tripData.travelers - Number of guests
 * @param {number} tripData.budget - Total budget
 * @returns {Promise<Object>} Hotel search results
 */
export async function fetchHotelData(tripData) {
    try {
        console.log('Fetching hotels from backend API...');

        const response = await fetch('/api/hotels', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                destination: tripData.arriveAt,
                checkInDate: tripData.departDate,
                checkOutDate: tripData.returnDate,
                adults: tripData.travelers,
                budget: tripData.budget
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Backend API error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch hotel data');
        }

        // Transform backend response to match existing format
        const transformedHotels = result.data.data ? result.data.data.map(hotelOffer => transformHotelOffer(hotelOffer)) : [];

        return {
            success: true,
            hotels: transformedHotels,
            count: transformedHotels.length,
            coordinates: result.coordinates
        };

    } catch (error) {
        console.error('Error fetching hotel data:', error);
        return {
            success: false,
            error: error.message,
            hotels: [],
            message: 'Unable to fetch hotel data. Please try again.'
        };
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
