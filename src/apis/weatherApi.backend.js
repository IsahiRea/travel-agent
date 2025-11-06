/**
 * Weather API Module (Backend Version)
 * Calls serverless functions instead of external APIs directly
 * This version secures API keys by moving them to the backend
 */

/**
 * Fetch weather forecast data from backend serverless function
 * @param {Object} tripData - Trip planning data
 * @param {string} tripData.arriveAt - Destination city
 * @param {string} tripData.departDate - Check-in date (YYYY-MM-DD)
 * @param {string} tripData.returnDate - Check-out date (YYYY-MM-DD)
 * @returns {Promise<Object>} Weather forecast data
 */
export async function fetchWeatherData(tripData) {
    try {
        console.log('Fetching weather from backend API...');

        const response = await fetch('/api/weather', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                city: tripData.arriveAt
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Backend API error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch weather data');
        }

        const weatherData = result.data;
        const { departDate, returnDate } = tripData;

        // Parse trip dates
        const startDate = new Date(departDate);
        const endDate = new Date(returnDate);

        // Filter forecasts to match trip dates
        const tripForecasts = filterForecastsByDates(weatherData.forecasts, startDate, endDate);

        return {
            success: true,
            city: weatherData.city,
            country: weatherData.country,
            forecast: tripForecasts,
            summary: generateWeatherSummary(tripForecasts)
        };

    } catch (error) {
        console.error('Error fetching weather data:', error);
        return {
            success: false,
            error: error.message,
            forecast: [],
            message: 'Unable to fetch weather data. Please try again.'
        };
    }
}

/**
 * Filter forecasts by trip dates
 * @param {Array} forecasts - All forecasts from API
 * @param {Date} startDate - Trip start date
 * @param {Date} endDate - Trip end date
 * @returns {Array} Filtered forecasts
 */
function filterForecastsByDates(forecasts, startDate, endDate) {
    return forecasts.filter(forecast => {
        const forecastDate = new Date(forecast.date);
        return forecastDate >= startDate && forecastDate <= endDate;
    }).map(forecast => ({
        date: forecast.date,
        tempMin: Math.round((forecast.temp_min - 32) * 5/9), // Convert F to C
        tempMax: Math.round((forecast.temp_max - 32) * 5/9), // Convert F to C
        tempAvg: Math.round((forecast.temp - 32) * 5/9), // Convert F to C
        condition: forecast.description,
        description: forecast.description,
        icon: forecast.icon,
        precipitation: forecast.humidity > 70,
        humidity: forecast.humidity,
        windSpeed: Math.round(forecast.wind_speed * 1.60934) // Convert mph to km/h
    }));
}

/**
 * Generate weather summary
 * @param {Array} forecasts - Daily forecasts
 * @returns {string} Summary text
 */
function generateWeatherSummary(forecasts) {
    if (!forecasts || forecasts.length === 0) {
        return 'Weather forecast unavailable';
    }

    const avgTemp = Math.round(
        forecasts.reduce((sum, day) => sum + day.tempAvg, 0) / forecasts.length
    );

    const rainyDays = forecasts.filter(day => day.precipitation).length;

    let summary = `Average temperature: ${avgTemp}°C. `;

    if (rainyDays > 0) {
        summary += `Expect rain on ${rainyDays} day${rainyDays > 1 ? 's' : ''}. `;
    } else {
        summary += `Mostly clear conditions. `;
    }

    return summary;
}
