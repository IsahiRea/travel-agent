# API Integration Reference

Complete guide to all external API integrations in the Travel Agent application.

## Overview

The application integrates four data sources to create comprehensive, AI-powered travel plans:

1. **Amadeus APIs** - Flight search, hotel search, city/airport lookup
2. **OpenWeatherMap API** - Weather forecasts and geocoding
3. **OpenAI API** - AI-powered trip plan generation

## Architecture

```
User Input (Planning Form)
    |
    v
Fetch in Parallel:
    +-- fetchFlightData()    --> Amadeus Flight API
    +-- fetchHotelData()     --> Amadeus Hotel API
    +-- fetchWeatherData()   --> OpenWeatherMap API
    |
    v
Combine Data --> prepareAIContext()
    |
    v
OpenAI Chat Completions API (Structured Output via Zod)
    |
    v
generateTripPlan() --> Complete Itinerary
    |
    v
Display Results to User
```

### File Structure

```
src/
+-- config.js                 # API client initialization
+-- api.js                    # Central export point for all APIs
+-- apis/
    +-- flightApi.js         # Amadeus Flight API integration
    +-- hotelApi.js          # Amadeus Hotel API integration
    +-- weatherApi.js        # OpenWeatherMap API integration
    +-- tripPlanApi.js       # OpenAI integration + trip generation
```

---

## Amadeus APIs

### Getting Credentials

1. Go to [Amadeus for Developers](https://developers.amadeus.com/)
2. Sign up for a free account or log in
3. Create a new application in the Self-Service dashboard
4. Copy your **API Key** and **API Secret**
5. Note: Free tier provides test environment access with limited requests

### Flight Search API

**Endpoint**: Flight Offers Search API

**Location**: `src/apis/flightApi.js`

**Function**: `fetchFlightData(tripData)`

**Parameters**:
- `departFrom`: Departure city/airport
- `arriveAt`: Arrival city/airport
- `departDate`: Departure date (YYYY-MM-DD)
- `returnDate`: Return date (YYYY-MM-DD)
- `travelers`: Number of adult passengers

**Process**:
1. Converts city names to IATA codes (uses cache)
2. Calls Amadeus Flight Offers Search API
3. Transforms response to application-friendly format

**API Call Example**:
```javascript
amadeus.shopping.flightOffersSearch.get({
  originLocationCode: 'JFK',
  destinationLocationCode: 'CDG',
  departureDate: '2025-12-01',
  returnDate: '2025-12-10',
  adults: '2',
  max: 10,
  currencyCode: 'USD'
})
```

**Response Structure**:
```javascript
{
  success: true,
  flights: [
    {
      id: "1",
      price: {
        total: "650.00",
        currency: "USD",
        formatted: "$650.00"
      },
      outbound: {
        departure: { airport: "JFK", time: "2025-12-01T10:00:00Z", terminal: "4" },
        arrival: { airport: "CDG", time: "2025-12-01T22:00:00Z", terminal: "2E" },
        duration: "PT8H",
        stops: 0,
        segments: [...]
      },
      return: { ... },
      airline: "DL",
      bookingClass: "ECONOMY"
    }
  ],
  count: 10
}
```

### Hotel Search API

**Endpoint**: Hotel Search API

**Location**: `src/apis/hotelApi.js`

**Function**: `fetchHotelData(tripData)`

**Process**:
1. Gets city coordinates via geocoding (uses cache)
2. Searches hotels by location
3. Returns hotel details with pricing

**Response Structure**:
```javascript
{
  success: true,
  hotels: [
    {
      id: "HOTEL123",
      name: "Hotel Name",
      rating: 4,
      location: "City Center",
      price: { total: "150.00", currency: "USD" },
      amenities: ["WiFi", "Pool", "Gym"]
    }
  ]
}
```

### City Search API

**Endpoint**: City Search / Airport Lookup API

**Location**: `src/apis/flightApi.js`

**Function**: `getAirportCode(cityName, token)`

**Features**:
- Returns IATA airport codes for city names
- Results cached in IndexedDB for 30 days
- Supports 40+ major cities worldwide

**Supported Cities**:
- **Americas**: New York, Los Angeles, Chicago, San Francisco, Miami, Seattle, Boston, Washington, Atlanta, Dallas, Houston, Las Vegas, Denver, Phoenix, Orlando, Toronto, Vancouver, Mexico City, Sao Paulo, Buenos Aires
- **Europe**: London, Paris, Barcelona, Madrid, Rome, Amsterdam, Frankfurt, Munich, Istanbul, Moscow
- **Asia**: Tokyo, Singapore, Hong Kong, Bangkok, Mumbai, Delhi, Beijing, Shanghai, Seoul, Dubai
- **Oceania**: Sydney, Melbourne
- **Africa**: Johannesburg, Cairo

---

## OpenWeatherMap API

### Getting Credentials

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key

### Weather Forecast API

**Endpoint**: `https://api.openweathermap.org/data/2.5/forecast`

**Location**: `src/apis/weatherApi.js`

**Function**: `fetchWeatherData(tripData)`

**Features**:
- Geocoding API to convert city names to coordinates
- 5-day/3-hour forecast data
- Daily weather aggregation (min/max/avg temperature)
- Precipitation detection
- Weather condition analysis

**Response Structure**:
```javascript
{
  success: true,
  city: "Paris",
  country: "FR",
  coordinates: { lat: 48.8566, lon: 2.3522 },
  forecast: [
    {
      date: "2025-10-15",
      tempMin: 18,
      tempMax: 25,
      tempAvg: 22,
      condition: "Clear",
      description: "clear sky",
      icon: "01d",
      precipitation: false,
      humidity: 65,
      windSpeed: 12
    }
  ],
  summary: "Average temperature: 22C. Mostly clear conditions."
}
```

### Geocoding

**Endpoint**: `https://api.openweathermap.org/geo/1.0/direct`

**Process**:
1. Check IndexedDB cache for coordinates
2. If cache miss, call Geocoding API
3. Store result in cache (365 days expiration)
4. Return coordinates for weather forecast

---

## OpenAI API

### Getting Credentials

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

### Trip Plan Generation

**Model**: `gpt-4o-2024-08-06` (supports structured outputs)

**Location**: `src/apis/tripPlanApi.js`

**Function**: `generateTripPlan(data)`

**Features**:
- **Structured Output**: Uses Zod schemas with `zodResponseFormat()` for type-safe JSON responses
- **Context-Aware**: Combines weather, flights, hotels, and user preferences
- **Budget-Conscious**: Ensures recommendations stay within budget
- **Weather-Adaptive**: Suggests indoor activities for rainy days, outdoor for clear weather

**Zod Schema Structure**:
```javascript
TripPlanSchema = {
  summary: string,
  destination: string,
  tripDuration: number,
  selectedFlight: {
    outboundDetails: string,
    returnDetails: string,
    totalCost: number,
    airline: string
  },
  selectedHotel: {
    name: string,
    rating: number,
    location: string,
    totalCost: number,
    amenities: string[]
  },
  dailyItinerary: [
    {
      day: number,
      date: string,
      weather: { temperature: string, condition: string, ... },
      activities: [...],
      meals: [...]
    }
  ],
  budgetAnalysis: { flights, accommodation, activities, meals, ... },
  travelTips: string[],
  packingRecommendations: string[]
}
```

**API Call Pattern**:
```javascript
const completion = await openai.chat.completions.parse({
  model: 'gpt-4o-2024-08-06',
  messages: [
    { role: 'system', content: 'You are an expert travel planner...' },
    { role: 'user', content: prepareAIContext(data) }
  ],
  response_format: zodResponseFormat(TripPlanSchema, 'trip_plan'),
  temperature: 0.7,
  max_tokens: 4000
});
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Amadeus API (for flights and hotels)
VITE_AMADEUS_API_KEY=your_amadeus_key
VITE_AMADEUS_API_SECRET=your_amadeus_secret

# OpenWeatherMap API
VITE_OPENWEATHER_API_KEY=your_openweather_key

# OpenAI API
VITE_OPENAI_API_KEY=your_openai_key
```

### Client Initialization

Located in `src/config.js`:

```javascript
import OpenAI from 'openai';

export const openai = import.meta.env.VITE_OPENAI_API_KEY ? new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
}) : null;
```

---

## Error Handling

### HTTP Status Code Handling

| Status | API | Handling |
|--------|-----|----------|
| `401` | All | Invalid API credentials - throws error with message |
| `400` | All | Bad request - extracts error detail from response |
| `404` | Amadeus | No results found - returns empty results with message |
| `429` | All | Rate limit exceeded - handle with retry logic |
| `500` | All | API server error - throws error |
| Network | All | Falls back to mock data |

### Error Flow Pattern

```javascript
try {
  const completion = await openai.chat.completions.parse({...});
  return completion.choices[0]?.message?.parsed;
} catch (error) {
  console.error('OpenAI error:', error);
  return getMockTripPlan(data); // Fallback
}
```

### Fallback Mode

If API credentials are not configured, functions automatically:
- Log a warning to console
- Return mock data for testing
- Set `isMock: true` flag in response

---

## Rate Limits & Quotas

### Amadeus (Test Environment)

- **Free tier**: 250 API calls/month
- **Rate limit**: 10 calls/second
- **Data**: Test data (not real-time pricing)

### Amadeus (Production Environment)

- Requires paid subscription
- Real-time pricing and availability
- Higher rate limits
- Change `hostname: 'production'` in config.js

### OpenWeatherMap (Free Tier)

- 1,000 calls/day
- 60 calls/minute

### OpenAI

- Varies by plan
- Monitor usage at platform.openai.com
- GPT-4o: $2.50/$10 per 1M input/output tokens

---

## Testing

### Without API Keys

The application works completely offline with realistic mock data:

```bash
# Remove or comment out API keys in .env
npm run dev
```

Console warnings will appear:
- "OpenWeatherMap API key not configured. Using mock data."
- "OpenAI not configured. Using mock trip plan."

### With API Keys

1. Configure all API keys in `.env`
2. Run `npm run dev`
3. Fill out the planning form with valid data
4. Check browser console for API logs

### Expected Console Output

```
Searching flights with params: {...}
Searching hotels in city: PAR
Fetching weather for Paris (48.8566, 2.3522)
Generating trip plan with OpenAI...
Successfully generated trip plan with OpenAI
```

---

## Support & Resources

### Official Documentation

- **Amadeus**: https://developers.amadeus.com/self-service/category/flights
- **OpenWeatherMap**: https://openweathermap.org/api
- **OpenAI**: https://platform.openai.com/docs

### API References

- **Amadeus Flight Search**: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search/api-reference
- **Amadeus GitHub**: https://github.com/amadeus4dev/amadeus-node
- **Amadeus Support**: https://developers.amadeus.com/support
