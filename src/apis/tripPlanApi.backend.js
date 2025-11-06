/**
 * Trip Plan API Module (Secure Backend Version - Non-Streaming)
 * Handles trip plan generation via secure backend (non-streaming version)
 * API Documentation: https://platform.openai.com/docs/api-reference/chat/create
 */

/**
 * Generate a trip plan using collected data via secure backend
 * @param {Object} data - Collected trip data
 * @param {Object} data.weather - Weather data
 * @param {Object} data.flights - Flight data
 * @param {Object} data.hotels - Hotel data
 * @param {Object} data.tripData - Original trip form data
 * @returns {Promise<Object>} Generated trip plan
 */
export async function generateTripPlan(data) {
    try {
        console.log('Generating trip plan via secure backend (non-streaming)...');

        const { weather, flights, hotels, tripData } = data;

        // ✅ NO API KEY in frontend code - calling secure backend
        const response = await fetch('/api/trip-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                weather,
                flights,
                hotels,
                tripData
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Backend error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to generate trip plan');
        }

        return result.data;

    } catch (error) {
        console.error('Error generating trip plan:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
