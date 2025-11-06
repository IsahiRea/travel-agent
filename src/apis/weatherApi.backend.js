/**
 * Weather API Module (Secure Backend Version)
 * Handles all weather-related API calls via secure backend
 * API Documentation: https://openweathermap.org/api
 */

/**
 * Fetch weather forecast data from secure backend endpoint
 * @param {Object} tripData - Trip planning data
 * @param {string} tripData.arriveAt - Destination city
 * @param {string} tripData.departDate - Check-in date (YYYY-MM-DD)
 * @param {string} tripData.returnDate - Check-out date (YYYY-MM-DD)
 * @returns {Promise<Object>} Weather forecast data
 */
export async function fetchWeatherData(tripData) {
    try {
        console.log('Calling secure backend for weather...');

        // ✅ NO API KEY in frontend code - calling secure backend
        const response = await fetch('/api/weather', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                arriveAt: tripData.arriveAt,
                departDate: tripData.departDate,
                returnDate: tripData.returnDate
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Backend error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch weather data');
        }

        return result.data;

    } catch (error) {
        console.error('Error fetching weather data:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
