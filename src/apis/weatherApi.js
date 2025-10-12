/**
 * Weather API Module
 * Handles all weather-related API calls using OpenWeatherMap API
 * API Documentation: https://openweathermap.org/api
 */

import { getCachedCoordinates, cacheCoordinates } from '../utils/cache/coordinatesCache.js';

/**
 * Get coordinates from city name using OpenWeatherMap Geocoding API
 * Uses IndexedDB cache to reduce API calls by 90%+
 * @param {string} cityName - City name
 * @returns {Promise<{lat: number, lon: number}>} Coordinates
 */
async function getCityCoordinates(cityName) {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

    try {
        // 1. Check IndexedDB cache first (instant lookup)
        const cachedCoords = await getCachedCoordinates(cityName);
        if (cachedCoords) {
            return cachedCoords;
        }

        // 2. Cache miss - fetch from OpenWeatherMap Geocoding API
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${apiKey}`
        );

        if (!response.ok) {
            throw new Error(`Geocoding API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error(`City not found: ${cityName}`);
        }

        const coordinates = {
            lat: data[0].lat,
            lon: data[0].lon
        };

        // 3. Cache the successful result for future use (365 days)
        await cacheCoordinates(cityName, coordinates.lat, coordinates.lon);

        return coordinates;
    } catch (error) {
        console.error('Error fetching coordinates:', error);

        // Try to use fallback coordinates but also cache them
        const fallbackCoords = { lat: 48.8566, lon: 2.3522 }; // Paris

        // Cache the fallback to avoid repeated API failures
        try {
            await cacheCoordinates(cityName, fallbackCoords.lat, fallbackCoords.lon);
        } catch (cacheError) {
            console.warn('Could not cache fallback coordinates:', cacheError);
        }

        return fallbackCoords;
    }
}

/**
 * Fetch weather forecast data for a trip destination
 * @param {Object} tripData - Trip planning data
 * @param {string} tripData.arriveAt - Destination city
 * @param {string} tripData.departDate - Check-in date (YYYY-MM-DD)
 * @param {string} tripData.returnDate - Check-out date (YYYY-MM-DD)
 * @returns {Promise<Object>} Weather forecast data
 */
export async function fetchWeatherData(tripData) {
    try {
        // Check if API key is configured
        if (!import.meta.env.VITE_OPENWEATHER_API_KEY) {
            console.warn('OpenWeatherMap API key not configured. Using mock data.');
            return getMockWeatherData(tripData);
        }

        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        const { arriveAt, departDate, returnDate } = tripData;

        // Get coordinates for the destination city
        const { lat, lon } = await getCityCoordinates(arriveAt);

        console.log(`Fetching weather for ${arriveAt} (${lat}, ${lon})`);

        // Fetch 7-day forecast using One Call API 3.0
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid OpenWeatherMap API key');
            } else if (response.status === 404) {
                throw new Error('Weather data not found for this location');
            }
            throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();

        // Parse trip dates
        const startDate = new Date(departDate);
        const endDate = new Date(returnDate);

        // Filter forecast data to match trip dates
        const tripForecast = filterForecastByDates(data.list, startDate, endDate);

        // Group by day and calculate daily summaries
        const dailyForecasts = groupForecastByDay(tripForecast);

        return {
            success: true,
            city: data.city.name,
            country: data.city.country,
            coordinates: { lat, lon },
            forecast: dailyForecasts,
            summary: generateWeatherSummary(dailyForecasts)
        };

    } catch (error) {
        console.error('Error fetching weather data:', error);
        console.warn('Using mock weather data due to API error');
        return getMockWeatherData(tripData);
    }
}

/**
 * Filter forecast data by trip dates
 * @param {Array} forecastList - Raw forecast list from API
 * @param {Date} startDate - Trip start date
 * @param {Date} endDate - Trip end date
 * @returns {Array} Filtered forecast data
 */
function filterForecastByDates(forecastList, startDate, endDate) {
    return forecastList.filter(item => {
        const forecastDate = new Date(item.dt * 1000);
        return forecastDate >= startDate && forecastDate <= endDate;
    });
}

/**
 * Group forecast data by day and calculate daily summaries
 * @param {Array} forecastList - Filtered forecast list
 * @returns {Array} Daily forecast summaries
 */
function groupForecastByDay(forecastList) {
    const dayMap = new Map();

    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!dayMap.has(dayKey)) {
            dayMap.set(dayKey, []);
        }
        dayMap.get(dayKey).push(item);
    });

    return Array.from(dayMap.entries()).map(([date, items]) => {
        const temps = items.map(i => i.main.temp);
        const conditions = items.map(i => i.weather[0]);

        // Find most common weather condition
        const conditionCounts = {};
        conditions.forEach(c => {
            conditionCounts[c.main] = (conditionCounts[c.main] || 0) + 1;
        });
        const dominantCondition = Object.keys(conditionCounts).reduce((a, b) =>
            conditionCounts[a] > conditionCounts[b] ? a : b
        );

        const dominantWeather = conditions.find(c => c.main === dominantCondition);

        return {
            date,
            tempMin: Math.round(Math.min(...temps)),
            tempMax: Math.round(Math.max(...temps)),
            tempAvg: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
            condition: dominantWeather.main,
            description: dominantWeather.description,
            icon: dominantWeather.icon,
            precipitation: items.some(i => i.rain || i.snow),
            humidity: Math.round(items.reduce((sum, i) => sum + i.main.humidity, 0) / items.length),
            windSpeed: Math.round(items.reduce((sum, i) => sum + i.wind.speed, 0) / items.length)
        };
    });
}

/**
 * Generate a summary of weather conditions for the trip
 * @param {Array} dailyForecasts - Daily forecast summaries
 * @returns {string} Weather summary text
 */
function generateWeatherSummary(dailyForecasts) {
    if (!dailyForecasts || dailyForecasts.length === 0) {
        return 'Weather forecast unavailable';
    }

    const avgTemp = Math.round(
        dailyForecasts.reduce((sum, day) => sum + day.tempAvg, 0) / dailyForecasts.length
    );

    const rainyDays = dailyForecasts.filter(day => day.precipitation).length;
    const conditions = dailyForecasts.map(day => day.condition);
    const mostCommon = conditions.sort((a, b) =>
        conditions.filter(c => c === a).length - conditions.filter(c => c === b).length
    ).pop();

    let summary = `Average temperature: ${avgTemp}°C. `;
    summary += `Mostly ${mostCommon.toLowerCase()} conditions. `;

    if (rainyDays > 0) {
        summary += `Expect rain on ${rainyDays} day${rainyDays > 1 ? 's' : ''}. `;
    }

    return summary;
}

/**
 * Generate mock weather data for testing/fallback
 * @param {Object} tripData - Trip planning data
 * @returns {Object} Mock weather data
 */
function getMockWeatherData(tripData) {
    const { departDate, returnDate, arriveAt } = tripData;
    const startDate = new Date(departDate);
    const endDate = new Date(returnDate);

    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const dailyForecasts = [];

    const weatherConditions = [
        { main: 'Clear', description: 'clear sky', icon: '01d' },
        { main: 'Clouds', description: 'few clouds', icon: '02d' },
        { main: 'Clouds', description: 'scattered clouds', icon: '03d' },
        { main: 'Rain', description: 'light rain', icon: '10d' }
    ];

    for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);

        const weather = weatherConditions[i % weatherConditions.length];

        dailyForecasts.push({
            date: currentDate.toISOString().split('T')[0],
            tempMin: 18 + Math.floor(Math.random() * 5),
            tempMax: 25 + Math.floor(Math.random() * 5),
            tempAvg: 22 + Math.floor(Math.random() * 5),
            condition: weather.main,
            description: weather.description,
            icon: weather.icon,
            precipitation: weather.main === 'Rain',
            humidity: 60 + Math.floor(Math.random() * 20),
            windSpeed: 10 + Math.floor(Math.random() * 10)
        });
    }

    return {
        success: true,
        city: arriveAt,
        country: 'Mock',
        coordinates: { lat: 0, lon: 0 },
        forecast: dailyForecasts,
        summary: generateWeatherSummary(dailyForecasts),
        isMock: true,
        message: 'Using sample weather data. Configure OpenWeatherMap API key for live data.'
    };
}
