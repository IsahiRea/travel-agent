/**
 * Vercel Serverless Function for Weather Data
 * Handles OpenWeather API calls
 */

/**
 * Get weather forecast for a city
 */
async function getWeatherForecast(cityName) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${process.env.OPENWEATHER_API_KEY}&units=imperial`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch weather data for ${cityName}`);
  }

  const data = await response.json();

  // Format weather data (group by day)
  const dailyForecasts = {};

  data.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];

    if (!dailyForecasts[date]) {
      dailyForecasts[date] = {
        date,
        temp: item.main.temp,
        temp_min: item.main.temp_min,
        temp_max: item.main.temp_max,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        wind_speed: item.wind.speed
      };
    } else {
      // Update min/max temps if necessary
      dailyForecasts[date].temp_min = Math.min(dailyForecasts[date].temp_min, item.main.temp_min);
      dailyForecasts[date].temp_max = Math.max(dailyForecasts[date].temp_max, item.main.temp_max);
    }
  });

  return {
    city: data.city.name,
    country: data.city.country,
    forecasts: Object.values(dailyForecasts)
  };
}

/**
 * Main handler for Vercel serverless function
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Allow both GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get city from query params (GET) or body (POST)
    const city = req.method === 'GET' ? req.query.city : req.body.city;

    // Validate required fields
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    // Get weather forecast
    const weatherData = await getWeatherForecast(city);

    // Return results
    return res.status(200).json({
      success: true,
      data: weatherData
    });

  } catch (error) {
    console.error('Weather API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch weather data'
    });
  }
}
