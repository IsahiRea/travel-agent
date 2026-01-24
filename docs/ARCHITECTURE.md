# Application Architecture

System design, data flow, component architecture, and performance strategies.

## Application Overview

### Tech Stack

- **React 19** - UI library with latest hooks
- **Vite 7** - Build tool with Fast Refresh
- **React Router DOM 7** - Client-side routing
- **OpenAI SDK** - AI integration
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
|   +-- Icon.jsx                # SVG icon component
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
|   +-- usePersistedState.js        # State persistence to sessionStorage
|   +-- useActiveSection.js         # Track active section for navigation
|   +-- useSmoothScroll.js          # Smooth scroll behavior
|
+-- utils/
|   +-- logger.js               # Centralized logging
|   +-- formatters.js           # Date/currency formatting
|   +-- bookingLinks.js         # Generate booking URLs
|
+-- constants/
|   +-- routes.js               # Route path constants
|   +-- api.js                  # API endpoint constants
|   +-- validation.js           # Form validation rules
|   +-- index.js                # Re-export all constants
|
+-- data/
|   +-- heroImages.js           # Home page carousel images
|
+-- apis/
    +-- flightApi.backend.js           # Amadeus flight search
    +-- hotelApi.backend.js            # Amadeus hotel search
    +-- weatherApi.backend.js          # OpenWeather integration
    +-- tripPlanApi.backend.js         # OpenAI trip planning
    +-- streamingTripPlanApi.backend.js # Streaming AI responses
    +-- unsplashApi.backend.js         # Unsplash image search
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

## Performance Architecture

### Optimization Strategies

1. **Concurrent API Calls**
   - Uses `Promise.all` to fetch weather, flights, and hotels in parallel
   - Reduces total wait time vs sequential fetching

2. **Code Splitting**
   - Route components lazy loaded with `React.lazy()`
   - Suspense boundaries with loading fallback

3. **Session Storage**
   - Uses sessionStorage for large trip data
   - Faster than navigation state for large objects

4. **Build Optimizations**
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
