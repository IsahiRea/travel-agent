# Code Execution Guide

Runtime code flow, execution paths, and how data moves through the application.

## Application Startup

### Entry Point Execution

```
index.html
    |
    v
main.jsx
    |
    +-- Import React, ReactDOM
    +-- Import App component
    +-- Import global CSS (index.css)
    |
    v
ReactDOM.createRoot(document.getElementById('root'))
    |
    v
<StrictMode>
    <App />
</StrictMode>
```

### App Component Initialization

```javascript
// src/App.jsx execution flow
function App() {
  return (
    <BrowserRouter>
      <Header />           // Always rendered
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Lazy Loading Execution

Routes use `React.lazy()` for code splitting:

```javascript
const Home = lazy(() => import('./pages/Home.jsx'));
const Planning = lazy(() => import('./pages/Planning.jsx'));
const Results = lazy(() => import('./pages/Results.jsx'));
```

**Execution sequence**:
1. User navigates to route
2. React triggers dynamic import
3. Suspense shows fallback while chunk loads
4. Component renders after chunk loaded

---

## Planning Page Execution

### Form Initialization

```
User navigates to /planning
    |
    v
Planning component mounts
    |
    +-- useState hooks initialize:
    |   +-- travelers = 2
    |   +-- departFrom = ''
    |   +-- arriveAt = ''
    |   +-- departDate = ''
    |   +-- returnDate = ''
    |   +-- budget = ''
    |
    +-- useActionState initializes:
        +-- state = { error: null, message: null }
        +-- isPending = false
```

### Form Submission Flow

```
User clicks "Plan my Trip!"
    |
    v
useActionState triggers handleSubmission()
    |
    +-- isPending = true (button shows "Planning...")
    |
    v
handleSubmission(_prevState, formData)
    |
    +-- Extract form values from FormData
    |
    +-- Validate required fields
    |   +-- If invalid: return { error: 'message', message: null }
    |
    +-- Validate dates (return date after depart date)
    |   +-- If invalid: return { error: 'message', message: null }
    |
    +-- Create tripData object
    |
    +-- Store in sessionStorage('tripFormData')
    |
    +-- navigate('/results')
    |
    v
Navigation to Results page (~500ms)
```

### Location Autocomplete Execution

```
User types in location field
    |
    v
onChange updates state
    |
    v
useEffect with debounce (300ms)
    |
    v
searchCityAirports(query)
    |
    +-- getAmadeusAccessToken()
    |
    +-- Call Amadeus City Search API
    |
    v
setSuggestions(results)
    |
    v
Dropdown renders with suggestions
```

---

## Results Page Execution

### Initial Mount

```
Results component mounts
    |
    v
useEffect runs on mount
    |
    +-- Read 'tripFormData' from sessionStorage
    |   +-- If not found: redirect to /planning
    |
    +-- Parse JSON to tripData object
    |
    v
Call useProgressiveTripData(tripData)
```

### Progressive Data Loading Hook

```javascript
// useProgressiveTripData execution
function useProgressiveTripData(tripData) {
  // Initial state
  const [stage, setStage] = useState('initializing');
  const [data, setData] = useState({
    weather: null,
    flights: null,
    hotels: null,
    plan: null
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [tripData]);

  async function loadData() {
    try {
      // Stage 1: Weather
      setStage('weather');
      const weather = await fetchWeatherData(tripData);
      setData(prev => ({ ...prev, weather }));

      // Stage 2: Flights
      setStage('flights');
      const flights = await fetchFlightData(tripData);
      setData(prev => ({ ...prev, flights }));

      // Stage 3: Hotels
      setStage('hotels');
      const hotels = await fetchHotelData(tripData);
      setData(prev => ({ ...prev, hotels }));

      // Stage 4: AI Generation
      setStage('ai');
      const plan = await generateTripPlan({
        weather, flights, hotels, tripData
      });
      setData(prev => ({ ...prev, plan }));

      // Complete
      setStage('complete');
      sessionStorage.setItem('tripPlan', JSON.stringify({
        weather, flights, hotels, plan, tripData
      }));

    } catch (err) {
      setError(err.message);
    }
  }

  return { stage, data, error, isLoading: stage !== 'complete' };
}
```

### Stage-by-Stage Rendering

```
stage === 'weather'
    |
    v
Render:
    +-- LoadingProgress (stage='weather', progress=20%)
    +-- LoadingSkeleton (weather section)

            |
            v (weather loaded)

stage === 'flights'
    |
    v
Render:
    +-- LoadingProgress (stage='flights', progress=40%)
    +-- WeatherCard (actual data)
    +-- LoadingSkeleton (flights section)

            |
            v (flights loaded)

stage === 'hotels'
    |
    v
Render:
    +-- LoadingProgress (stage='hotels', progress=60%)
    +-- WeatherCard (actual data)
    +-- FlightCard (actual data)
    +-- LoadingSkeleton (hotels section)

            |
            v (hotels loaded)

stage === 'ai'
    |
    v
Render:
    +-- LoadingProgress (stage='ai', progress=80%)
    +-- WeatherCard, FlightCard, HotelCard (actual data)
    +-- LoadingSkeleton (itinerary section)
    +-- "This typically takes 10-15s" message

            |
            v (AI complete)

stage === 'complete'
    |
    v
Render:
    +-- Full trip plan with all components
    +-- No loading indicators
```

---

## API Execution Flows

### Weather Data Fetch

```
fetchWeatherData(tripData)
    |
    v
getCityCoordinates(tripData.arriveAt)
    |
    +-- Fetch from OpenWeatherMap Geocoding API
    |   +-- GET /geo/1.0/direct?q={city}
    |
    v
Return { lat, lon }
    |
    v
Fetch 5-day forecast
    |
    +-- GET /data/2.5/forecast?lat={lat}&lon={lon}
    |
    v
Process and aggregate daily data
    |
    v
Return weather object
```

### Flight Data Fetch

```
fetchFlightData(tripData)
    |
    v
getAirportCode(tripData.departFrom)
    |
    +-- getAmadeusAccessToken()
    |   +-- POST /v1/security/oauth2/token
    |
    +-- Call Amadeus City Search API
    |   +-- GET /v1/reference-data/locations/cities
    |
    v
Return IATA code (e.g., 'JFK')
    |
    v
getAirportCode(tripData.arriveAt)
    |
    v
Return IATA code (e.g., 'CDG')
    |
    v
Call Amadeus Flight Search API
    |
    +-- GET /v2/shopping/flight-offers
    |   +-- params: origin, destination, dates, adults
    |
    v
Transform response to application format
    |
    v
Return flights array
```

### AI Trip Plan Generation

```
generateTripPlan({ weather, flights, hotels, tripData })
    |
    v
getOpenAIClient()
    |
    +-- Check if client initialized
    +-- Return cached client or create new
    |
    v
prepareAIContext(data)
    |
    +-- Format trip details (travelers, route, dates, budget)
    +-- Format weather forecast summary
    +-- Format top 3 flight options
    +-- Format top 3 hotel options
    +-- Add generation requirements
    |
    v
Return context string (~2000 tokens)
    |
    v
openai.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [system prompt, user context],
    response_format: zodResponseFormat(TripPlanSchema),
    temperature: 0.7,
    max_tokens: 4000
})
    |
    v
Wait for completion (~10-15 seconds)
    |
    v
Extract parsed response
    |
    +-- completion.choices[0].message.parsed
    |
    v
Validate against Zod schema (automatic)
    |
    v
Return structured trip plan object
```

---

## Error Handling Execution

### API Error Flow

```
API call fails
    |
    v
Catch block executes
    |
    +-- Log error to console
    |
    +-- Check error type:
    |   +-- 401: "Invalid API credentials"
    |   +-- 400: Extract detail from response
    |   +-- 404: "No results found"
    |   +-- 429: "Rate limit exceeded"
    |   +-- Network: "Connection failed"
    |
    v
Return fallback/mock data OR throw error
    |
    v
If thrown, caught by useProgressiveTripData
    |
    v
setError(error.message)
    |
    v
Render ErrorDisplay component
    |
    +-- Show error message
    +-- Retry button (resets state, retries load)
    +-- Back to Planning button
```

### Graceful Degradation

```
Missing API key detected
    |
    v
Log warning: "API key not configured. Using mock data."
    |
    v
Return mock data with isMock: true flag
    |
    v
Application continues with realistic test data
```

---

## Session Storage Flow

### Planning Page Write

```javascript
// Before navigation
sessionStorage.setItem('tripFormData', JSON.stringify({
  travelers: 2,
  departFrom: 'New York City',
  arriveAt: 'Paris',
  departDate: '2025-06-01',
  returnDate: '2025-06-10',
  budget: 5000
}));
```

### Results Page Read

```javascript
// On mount
const stored = sessionStorage.getItem('tripFormData');
if (!stored) {
  navigate('/planning');
  return;
}
const tripData = JSON.parse(stored);
```

### Results Page Write (After Load Complete)

```javascript
// After all data loaded
sessionStorage.setItem('tripPlan', JSON.stringify({
  weather: { ... },
  flights: { ... },
  hotels: { ... },
  plan: { ... },
  tripData: { ... }
}));
```

### Browser Refresh Handling

```
User refreshes Results page
    |
    v
Check sessionStorage('tripPlan')
    |
    +-- Found: Display cached results immediately
    |
    +-- Not found: Check sessionStorage('tripFormData')
        |
        +-- Found: Re-run progressive loading
        +-- Not found: Redirect to /planning
```

---

## Component Render Cycle

### Conditional Rendering Pattern

```javascript
function Results() {
  const { stage, data, error, isLoading } = useProgressiveTripData(tripData);

  // Error state takes priority
  if (error) {
    return <ErrorDisplay error={error} onRetry={retry} />;
  }

  return (
    <div className="results-page">
      {/* Always show progress when loading */}
      {isLoading && <LoadingProgress stage={stage} />}

      {/* Show skeleton or actual content based on data availability */}
      {data.weather ? (
        <WeatherCard data={data.weather} />
      ) : (
        <LoadingSkeleton type="weather" />
      )}

      {data.flights ? (
        <FlightCard data={data.flights} />
      ) : (
        stage !== 'weather' && <LoadingSkeleton type="flights" />
      )}

      {data.hotels ? (
        <HotelCard data={data.hotels} />
      ) : (
        stage !== 'weather' && stage !== 'flights' &&
        <LoadingSkeleton type="hotels" />
      )}

      {data.plan ? (
        <>
          <DailyItinerary data={data.plan.dailyItinerary} />
          <BudgetBreakdown data={data.plan.budgetAnalysis} />
          <TravelTips tips={data.plan.travelTips} />
          <PackingList items={data.plan.packingRecommendations} />
        </>
      ) : (
        stage === 'ai' && <LoadingSkeleton type="itinerary" />
      )}
    </div>
  );
}
```

---

## Performance Timeline

```
Time     | Event                              | User Sees
---------|------------------------------------|-----------------------
0ms      | Click "Plan my Trip!"              | Button changes to "Planning..."
100ms    | Form validation complete           | -
200ms    | SessionStorage write               | -
500ms    | Navigation complete                | Results page skeleton
1s       | Weather fetch starts               | "Checking weather..."
3s       | Weather loaded                     | Weather card appears
3.5s     | Flights fetch starts               | "Finding flights..."
7s       | Flights loaded                     | Flight card appears
7.5s     | Hotels fetch starts                | "Searching hotels..."
11s      | Hotels loaded                      | Hotel card appears
11.5s    | AI generation starts               | "Creating itinerary..."
25s      | AI complete                        | Full itinerary appears
```

**Key insight**: User sees first content at 500ms, not 25 seconds.
