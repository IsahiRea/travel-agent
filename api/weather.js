/**
 * Vercel Serverless Function for Weather Data
 * Handles OpenWeatherMap API with secure credentials
 */

/**
 * Get coordinates from city name using OpenWeatherMap Geocoding API
 */
async function getCityCoordinates(cityName) {
  const apiKey = process.env.OPENWEATHER_API_KEY; // SECURE

  try {
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

    return {
      lat: data[0].lat,
      lon: data[0].lon
    };
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    // Fallback to Paris coordinates
    return { lat: 48.8566, lon: 2.3522 };
  }
}

/**
 * Filter forecast data by trip dates
 */
function filterForecastByDates(forecastList, startDate, endDate) {
  return forecastList.filter(item => {
    const forecastDate = new Date(item.dt * 1000);
    return forecastDate >= startDate && forecastDate <= endDate;
  });
}

/**
 * Group forecast data by day and calculate daily summaries
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

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { arriveAt, departDate, returnDate } = req.body;

    // Validate
    if (!arriveAt || !departDate || !returnDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY; // SECURE

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

    return res.status(200).json({
      success: true,
      data: {
        city: data.city.name,
        country: data.city.country,
        coordinates: { lat, lon },
        forecast: dailyForecasts,
        summary: generateWeatherSummary(dailyForecasts)
      }
    });

  } catch (error) {
    console.error('Weather API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch weather data'
    });
  }
}
