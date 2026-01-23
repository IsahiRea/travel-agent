# Application Architecture

System design, data flow, component architecture, and caching strategies.

## Application Overview

### Tech Stack

- **React 19** - UI library with latest hooks
- **Vite 7** - Build tool with Fast Refresh
- **React Router DOM 7** - Client-side routing
- **OpenAI SDK** - AI integration
- **IndexedDB (idb)** - Browser caching
- **Zod** - Schema validation

### Entry Points

- `src/main.jsx` - Application entry, renders root into `#root`
- `src/App.jsx` - Root component with React Router

### Routing Structure

```
/              -> Home (lazy loaded)
/planning      -> Planning (lazy loaded)
/results       -> Results (lazy loaded)
```

---

## Data Flow

### Planning Flow

```
User clicks "Plan my Trip!"
    |
    v
Form Validation (instant)
    |
    v
Save tripFormData to sessionStorage
    |
    v
Navigate to /results (~500ms)
    |
    v
Results Page Loads
    |
    v
useProgressiveTripData Hook Starts
    |
    +-- Stage: 'weather'
    |   +-- fetchWeatherData() (2-3s)
    |   +-- Update data.weather
    |
    +-- Stage: 'flights'
    |   +-- fetchFlightData() (3-5s)
    |   +-- Update data.flights
    |
    +-- Stage: 'hotels'
    |   +-- fetchHotelData() (3-5s)
    |   +-- Update data.hotels
    |
    +-- Stage: 'ai'
    |   +-- generateTripPlan() (10-15s)
    |   +-- Update data.plan
    |
    +-- Stage: 'complete'
        +-- Save to sessionStorage('tripPlan')
```

### Progressive Loading Architecture

**Before (Original Pattern)**:
- User waited 15-20 seconds on Planning page
- No feedback, page appeared frozen
- All data appeared at once on Results page

**After (Progressive Loading)**:
- User navigates to Results page in ~500ms
- Each data stage shows progress indicator
- Content appears incrementally as it loads
- User engagement maintained throughout

```
Planning Page                      Results Page
-----------------                  -----------
Submit form -------------------------> Show loading skeleton
     |                                      |
     +-- Save to sessionStorage       Fetch weather (stream)
                                            | display weather
                                       Fetch flights (stream)
                                            | display flights
                                       Fetch hotels (stream)
                                            | display hotels
                                       Generate AI plan (stream)
                                            | display itinerary
```

### State Management Flow

```
useProgressiveTripData Hook State:

Initial State
+----------------------------------------+
|  stage: 'initializing'                 |
|  data: { weather: null, flights: null, |
|          hotels: null, plan: null }    |
|  error: null                           |
|  isLoading: true                       |
+----------------------------------------+
            |
            v
Weather Loaded
+----------------------------------------+
|  stage: 'flights'                      |
|  data: { weather: {...}, flights: null,|
|          hotels: null, plan: null }    |
+----------------------------------------+
            |
            v
Flights Loaded
+----------------------------------------+
|  stage: 'hotels'                       |
|  data: { weather: {...}, flights: {...}|
|          hotels: null, plan: null }    |
+----------------------------------------+
            |
            v
Hotels Loaded
+----------------------------------------+
|  stage: 'ai'                           |
|  data: { weather: {...}, flights: {...}|
|          hotels: {...}, plan: null }   |
+----------------------------------------+
            |
            v
Complete
+----------------------------------------+
|  stage: 'complete'                     |
|  data: { weather: {...}, flights: {...}|
|          hotels: {...}, plan: {...} }  |
|  isLoading: false                      |
+----------------------------------------+
```

---

## Component Architecture

### Directory Structure

```
src/
+-- components/
|   +-- Header.jsx              # Navigation header
|   +-- HeroCarousel.jsx        # Home page carousel
|   +-- LoadingProgress.jsx     # Stage progress indicator
|   +-- LoadingSkeleton.jsx     # Placeholder skeletons
|   +-- LocationAutocomplete.jsx # City search autocomplete
|   +-- ErrorDisplay.jsx        # Error state component
|   +-- results/                # Results page components
|       +-- BudgetBreakdown.jsx
|       +-- DailyItinerary.jsx
|       +-- FlightCard.jsx
|       +-- HotelCard.jsx
|       +-- PackingList.jsx
|       +-- RecommendationCard.jsx
|       +-- ResultsSidebar.jsx
|       +-- TravelTips.jsx
|       +-- TripHeader.jsx
|       +-- TripInfoCards.jsx
|       +-- TripSummary.jsx
|       +-- WeatherCard.jsx
|
+-- pages/
|   +-- Home.jsx                # Landing page
|   +-- Planning.jsx            # Trip planning form
|   +-- Results.jsx             # Trip results display
|
+-- hooks/
|   +-- useProgressiveTripData.js   # Progressive data loading
|   +-- useStreamingTripPlan.js     # AI streaming support
|   +-- useTripData.js              # Trip data management
|   +-- useAirportSuggestions.js    # Airport autocomplete
```

### Component Hierarchy (Results Page)

```
Results Page
+-- LoadingProgress
|   +-- Current stage icon
|   +-- Stage description
|   +-- Progress stages grid
|   +-- Progress bar
|   +-- Loading note (for AI stage)
|
+-- LoadingSkeleton (conditional)
|   +-- Weather skeleton
|   +-- Flight skeleton
|   +-- Hotel skeleton
|   +-- Itinerary skeleton
|
+-- Actual Content (conditional)
|   +-- Hero banner
|   +-- Trip info cards
|   +-- Weather card
|   +-- Flight recommendation
|   +-- Hotel recommendation
|   +-- Budget breakdown
|   +-- Daily itinerary
|   +-- Travel tips
|   +-- Packing recommendations
|   +-- Trip summary
|
+-- ErrorDisplay (conditional)
    +-- Error icon
    +-- Error message
    +-- Retry button
    +-- Back to Planning button
```

---

## Caching System

### Overview

The application uses IndexedDB for persistent caching to reduce API calls and improve performance.

```
src/utils/
+-- cache/
|   +-- cacheDB.js           # Centralized schema management
|   +-- indexedDBCache.js    # Generic cache operations
|   +-- airportCache.js      # Airport code caching
|   +-- coordinatesCache.js  # City coordinates caching
+-- tokenCache.js            # In-memory OAuth token cache
+-- formatters.js            # Formatting utilities
+-- logger.js                # Centralized logging
```

### Database Schema

**Database Name**: `travel-agent-cache`
**Version**: 2

| Object Store | Key Path | Purpose | Cache Duration |
|--------------|----------|---------|----------------|
| `airport-codes` | `query` | City name to IATA code | 30 days |
| `city-coordinates` | `query` | City name to lat/lon | 365 days |

### Airport Code Cache

**Location**: `src/utils/cache/airportCache.js`

**Purpose**: Reduces Amadeus City Search API calls by caching city-to-airport mappings.

**Cache Entry Structure**:
```javascript
{
  query: "paris",           // Normalized search query (key)
  code: "CDG",              // IATA airport code
  timestamp: 1699999999000, // Unix timestamp
  originalQuery: "Paris"    // Original query for debugging
}
```

**API**:
```javascript
import { getCachedAirportCode, cacheAirportCode } from '../utils/cache/airportCache.js';

// Check cache
const code = await getCachedAirportCode('Paris');

// Store in cache
await cacheAirportCode('Paris', 'CDG');
```

### Coordinates Cache

**Location**: `src/utils/cache/coordinatesCache.js`

**Purpose**: Reduces OpenWeatherMap Geocoding API calls by caching city coordinates.

**Cache Entry Structure**:
```javascript
{
  query: "paris",                // Normalized search query (key)
  lat: 48.8566,                  // Latitude
  lon: 2.3522,                   // Longitude
  timestamp: 1699999999000,      // Unix timestamp
  originalQuery: "Paris"         // Original query for debugging
}
```

**API**:
```javascript
import { getCachedCoordinates, cacheCoordinates } from '../utils/cache/coordinatesCache.js';

// Check cache
const coords = await getCachedCoordinates('Paris');
// Returns: { lat: 48.8566, lon: 2.3522 } or null

// Store in cache
await cacheCoordinates('Paris', 48.8566, 2.3522);
```

**Performance Gains**:
- **API call reduction**: 90% fewer geocoding calls
- **Response time**: 99.7% faster after first call (<1ms vs 200ms)

### Token Cache

**Location**: `src/utils/tokenCache.js`

**Purpose**: In-memory caching of Amadeus OAuth tokens to prevent unnecessary authentication API calls.

**Features**:
- Stores access tokens with expiration tracking
- Automatic token refresh before expiration

### Cache Flow Diagram

```
User searches weather for "Paris"
        |
        v
Check IndexedDB coordinates cache
        |
    Cache Hit? -------> YES --> Return cached coords [<1ms]
        |
       NO
        |
        v
Fetch from OpenWeatherMap Geocoding API [100-300ms]
        |
        v
Store coordinates in IndexedDB cache
        |
        v
Return fetched coordinates
```

### Cache Statistics

Each cache provides statistics:
```javascript
const stats = await getCacheStats();
/*
{
  totalEntries: 50,
  validEntries: 48,
  expiredEntries: 2,
  oldestEntry: 1697000000000,
  newestEntry: 1699999999000,
  cacheSize: 4800
}
*/
```

### Browser Compatibility

IndexedDB is supported in:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+
- All modern mobile browsers

**Coverage**: 98%+ of users

---

## Performance Architecture

### Optimization Strategies

1. **Concurrent API Calls**
   - Uses `Promise.all` to fetch weather, flights, and hotels in parallel
   - Reduces total wait time vs sequential fetching

2. **IndexedDB Caching**
   - Airport codes cached for 30 days
   - City coordinates cached for 365 days
   - Eliminates repeat API calls for same queries

3. **Code Splitting**
   - Route components lazy loaded with `React.lazy()`
   - Suspense boundaries with loading fallback

4. **Session Storage**
   - Uses sessionStorage for large trip data
   - Faster than navigation state for large objects

5. **Token Caching**
   - Amadeus OAuth tokens cached in memory
   - Prevents authentication on every request

6. **Build Optimizations**
   - Image optimization with vite-imagetools
   - Gzip/Brotli compression for production
   - Tree shaking removes unused code
   - Vendor chunk splitting for better caching

### Bundle Analysis

Approximate bundle sizes (gzipped):
- Main bundle: ~150-200KB
- React vendor chunk: ~130-150KB
- OpenAI SDK chunk: ~80-100KB
- Total initial load: ~350-450KB

### Performance Timeline

```
Time          | Event
--------------+----------------------------------
0.0s          | User clicks "Plan my Trip!"
0.1s          | Form validation complete
0.2s          | SessionStorage write complete
0.5s          | Navigation to Results page
1.0s          | Stage: Weather loading
3.0s          | Weather data loaded
3.5s          | Stage: Flights loading
7.0s          | Flight data loaded
7.5s          | Stage: Hotels loading
11.0s         | Hotel data loaded
11.5s         | Stage: AI Generation
25.0s         | AI generation complete
```

**Key Metric**: Time to first content = ~500ms (navigation) vs previous 15-20s wait.

---

## SessionStorage Strategy

### Planning Page Output

```javascript
sessionStorage.setItem('tripFormData', JSON.stringify({
  travelers: 2,
  departFrom: 'New York City',
  arriveAt: 'Paris',
  departDate: '2025-06-01',
  returnDate: '2025-06-10',
  budget: 5000
}));
```

### Results Page Output

```javascript
sessionStorage.setItem('tripPlan', JSON.stringify({
  weather: { ... },
  flights: { ... },
  hotels: { ... },
  plan: { ... },
  tripData: { ... }
}));
```

---

## Error Handling Architecture

```
Progressive Loading
    |
    Try {
        +-- Fetch weather
        +-- Fetch flights
        +-- Fetch hotels
        +-- Generate AI plan
    }
    |
    v
Error Occurs?
    |
+---+---+
NO      YES
|        |
v        v
Complete  ErrorDisplay Shows
          +-- Error Icon
          +-- Error message
          |
          Actions:
          +-- Retry button
          +-- Back to Planning button
```

**Philosophy**: Cache is an optimization, not a requirement. App must work even if IndexedDB fails.
