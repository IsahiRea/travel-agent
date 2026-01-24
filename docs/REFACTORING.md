# Refactoring & Technical Debt

TODOs, completed optimizations, and future improvement opportunities.

## Status Overview

| Category | Status |
|----------|--------|
| Progressive Loading | Completed |
| AI Streaming | Completed |
| Constants Directory | Completed |
| Remaining TODOs | 4 items |
| Code Duplication | 6 opportunities identified |
| Large Components | 2 components need splitting |
| Missing Abstractions | 2 hooks to create |

---

## Completed Refactors

### 1. Progressive Loading Implementation

**Summary**: Changed from blocking 15-20 second wait to progressive data loading.

**Before**:
- User waited 15-20 seconds on Planning page
- No feedback, page appeared frozen
- All data appeared at once

**After**:
- User navigates to Results page in ~500ms
- Each data stage shows progress indicator
- Content appears incrementally as it loads

**Components Added**:
- `LoadingProgress.jsx` - Stage progress indicator
- `LoadingSkeleton.jsx` - Placeholder skeletons
- `useProgressiveTripData.js` - Progressive loading hook

**UX Improvement**: Perceived wait time reduced from 15-20s to ~500ms.

---

### 2. AI Streaming Support

**Summary**: Added streaming trip plan generation for real-time feedback.

**Implementation**:
- `useStreamingTripPlan.js` hook for streaming AI responses
- Fallback to non-streaming for production stability
- Real-time progress updates during generation

**Technical Decision**: Kept current OpenAI SDK instead of migrating to Vercel AI SDK.

**Rationale**:
- Simple, single-step AI interaction pattern
- No tool calling needed (data fetched upfront)
- No streaming required (full response needed for navigation)
- AI SDK would add +105KB bundle size with no clear benefit
- Current implementation is simpler and easier to maintain

---

### 3. Constants Directory

**Summary**: Created centralized constants directory for routes, API endpoints, and validation rules.

**Structure**:
```
src/constants/
+-- routes.js         # Route path constants
+-- api.js            # API endpoints, timeouts
+-- validation.js     # Form validation rules
+-- index.js          # Re-export all
```

**Benefits**:
- Single source of truth for constants
- Easy to maintain and update
- Prevents magic strings in components
- Clear organization of application-wide values

---

## Remaining TODOs

### 1. One-Way Trip Option

**Location**: `src/pages/Planning.jsx:24`

```javascript
//TODO: Add option for one-way trips (hide return date)
```

**Priority**: Medium

**Implementation Approach**:
```javascript
// Add state for trip type
const [tripType, setTripType] = useState('round-trip');

// Add toggle in form
<div className="trip-type-toggle">
  <button
    className={tripType === 'round-trip' ? 'active' : ''}
    onClick={() => setTripType('round-trip')}
  >
    Round Trip
  </button>
  <button
    className={tripType === 'one-way' ? 'active' : ''}
    onClick={() => setTripType('one-way')}
  >
    One Way
  </button>
</div>

// Conditionally render return date
{tripType === 'round-trip' && (
  <div className="form-group">
    <label>Return Date</label>
    <input type="date" name="returnDate" ... />
  </div>
)}

// Update validation and API calls
```

**Affected Files**:
- `src/pages/Planning.jsx` - Form UI and validation
- `src/apis/flightApi.backend.js` - API call parameters
- `src/pages/Planning.css` - Toggle styling

---

### 2. Missing Icons in ResultsSidebar

**Location**: `src/components/results/ResultsSidebar.jsx:103`

```javascript
{/* TODO: No icons called info and lightbulb */}
```

**Priority**: Low

**Implementation Approach**:
1. Add icons to `src/assets/icons/` directory
2. Import and use in component

```javascript
import infoIcon from '../../assets/icons/info.svg';
import lightbulbIcon from '../../assets/icons/lightbulb.svg';

// In JSX
<img src={infoIcon} alt="" className="section-icon" />
<img src={lightbulbIcon} alt="" className="section-icon" />
```

**Alternative**: Use Unicode symbols or emoji as fallback:
- Info: `ℹ️` or `(i)`
- Lightbulb: `💡` or `*`

---

### 3. Unsplash Backend Download Endpoint

**Location**: `src/apis/unsplashApi.backend.js:50`

```javascript
// TODO: Implement backend endpoint for Unsplash download trigger
```

**Priority**: Low (only needed if using Unsplash integration)

---

### 4. Unsplash Photo by ID Endpoint

**Location**: `src/apis/unsplashApi.backend.js:61`

```javascript
// TODO: Implement backend endpoint for getting photo by ID
```

**Priority**: Low (only needed if using Unsplash integration)

---

## Code Duplication & Refactoring Opportunities

### HIGH Priority

#### 1. API Module Duplication (~150 lines reducible)

**Files**:
- `src/apis/flightApi.backend.js`
- `src/apis/hotelApi.backend.js`
- `src/apis/weatherApi.backend.js`
- `src/apis/tripPlanApi.backend.js`
- `src/apis/unsplashApi.backend.js`
- `src/apis/streamingTripPlanApi.backend.js`

**Issue**: All five API modules follow the exact same fetch/error handling pattern.

**Solution**: Create a generic API client utility:

```javascript
// src/utils/apiClient.js
export async function apiRequest(endpoint, options = {}) {
    const { method = 'POST', body, errorMessage = 'Request failed' } = options;

    try {
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            ...(body && { body: JSON.stringify(body) })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Backend error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || errorMessage);
        }

        return result.data;
    } catch (error) {
        console.error(`${errorMessage}:`, error);
        return { success: false, error: error.message };
    }
}
```

---

#### 2. Planning.jsx Complexity (430 lines)

**File**: `src/pages/Planning.jsx`

**Issue**: Component handles too many responsibilities:
- 7 state variables with `usePersistedState`
- Field validation logic
- Form submission handling
- Navigation and error state

**Solution**:

1. Extract form field components:
   - `TripTypeSelector`
   - `TravelerCounter`
   - `DatePicker` (with error handling)
   - `BudgetInput`

2. Extract form logic into custom hook:
```javascript
// src/hooks/useTripPlanningForm.js
export function useTripPlanningForm() {
    const [tripType, setTripType] = usePersistedState(...);
    const [travelers, setTravelers] = usePersistedState(...);
    // ... other state

    const handleIncrement = () => ...;
    const handleDecrement = () => ...;
    const handleSwapLocations = () => ...;
    const validateForm = (formData) => ...;

    return {
        formState: { tripType, travelers, ... },
        formActions: { handleIncrement, handleDecrement, ... },
        validateForm
    };
}
```

---

### MEDIUM Priority

#### 3. FlightCard/HotelCard Duplication

**Files**:
- `src/components/results/FlightCard.jsx`
- `src/components/results/HotelCard.jsx`

**Issue**: Both share same structure (handleBookingClick, card layout, CSS import).

**Solution**: Create generic `RecommendationCard` component:

```javascript
export default function RecommendationCard({
    type, data, tripData, isStreaming,
    image, icon, badge, title, description, tags,
    generateBookingLink, bookingLabel
}) { ... }
```

---

#### 4. Mixed Icon Usage Patterns

**Files**:
- `src/pages/Planning.jsx` - URL-based imports
- `src/pages/Results.jsx` - Icon component
- `src/pages/Home.jsx` - Direct SVG imports

**Solution**: Standardize on the existing `Icon` component across all files.

---

#### 5. Inconsistent Error Return Patterns

**Issue**: API functions return errors differently:
- Some: `{ success: false, error: message }`
- Some: throw errors
- `searchCityAirports`: returns empty array

**Solution**: Standardize on single error pattern across all API functions.

---

#### 6. Missing useDebounce Hook

**Files with manual debouncing**:
- `src/hooks/usePersistedState.js` (lines 40-71)
- `src/components/LocationAutocomplete.jsx` (lines 39-74)

**Solution**: Create reusable hook:

```javascript
// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
```

---

### LOW Priority

#### 7. TravelTips/PackingList Near-Duplication

**Files**:
- `src/components/results/TravelTips.jsx`
- `src/components/results/PackingList.jsx`

**Solution**: Create generic `ListSection` component.

---

#### 8. calculateDuration in ResultsSidebar

**File**: `src/components/results/ResultsSidebar.jsx` (lines 10-16)

**Solution**: Move to `src/utils/formatters.js` as `calculateTripDuration()`.

---

#### 9. Storage Key Inconsistency

**Issue**: `STORAGE_KEYS` constants define `'tripPlanData'` but code uses `'tripFormData'`.

**Solution**: Use constants consistently or update to match actual usage.

---

#### 10. Magic Numbers

**Files with hardcoded values**:
- `usePersistedState.js`: 500ms debounce, 7 days expiration
- `LocationAutocomplete.jsx`: 2 char min, 150ms delay, 300ms debounce

**Solution**: Define as named constants.

---

#### 11. Console.log in Production

**Issue**: Extensive console.log statements across API files.

**Solution**: Use development-only logger:

```javascript
const isDev = import.meta.env.DEV;
export const devLog = isDev ? console.log.bind(console) : () => {};
```

---

#### 12. Unused Config Export

**File**: `src/config.js`

**Issue**: `config` object exported but never imported.

**Solution**: Remove or utilize in API modules.

---

## Refactoring Metrics

| Metric | Current | After Refactoring |
|--------|---------|-------------------|
| Code Duplication | ~200 lines | ~50 lines |
| Avg Component Size | 150 lines | 80-100 lines |
| API Module Lines | ~400 total | ~200 total |
| Reusable Hooks | 4 | 6 |
| Utility Functions | 6 | 10 |

---

## Future Opportunities

### 1. CSS Consolidation

**Current Issue**: CSS files scattered across 3+ locations.

**Current Structure**:
- 6 CSS files in `src/components/`
- 10 CSS files in `src/components/results/styles/`
- 3 CSS files in `src/pages/`
- 1 CSS file at project root (`index.css`)

**Recommendation**: Create centralized `src/styles/` directory:

```
src/styles/
+-- global.css              # Root styles (from index.css)
+-- variables.css           # CSS custom properties
+-- components/             # All component styles
|   +-- Header.css
|   +-- LoadingProgress.css
|   +-- FlightCard.css
|   +-- ...
+-- pages/                  # Page-specific styles
    +-- Home.css
    +-- Planning.css
    +-- Results.css
```

**Benefits**:
- Single source of truth for styles
- Easier navigation and maintenance
- Better organization for theming
- Cleaner component directories

---

### 2. CSS Variables File

**Recommendation**: Create `src/styles/variables.css`:

```css
:root {
  /* Color Palette */
  --color-primary: #b5654d;
  --color-secondary: #d4a574;
  --color-text-primary: #2d2d2d;
  --color-text-secondary: #6b5d53;
  --color-border: #e5ded7;
  --color-background: #f2e6dc;

  /* Spacing */
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  /* Transitions */
  --transition-fast: 0.2s;
  --transition-normal: 0.3s;
}
```

**Usage**:
```css
/* Before */
.button { background: #b5654d; padding: 16px 24px; }

/* After */
.button { background: var(--color-primary); padding: var(--spacing-md) var(--spacing-lg); }
```

---

### 3. Path Aliases

**Recommendation**: Add to `vite.config.js`:

```javascript
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@utils': '/src/utils',
      '@hooks': '/src/hooks',
      '@apis': '/src/apis',
      '@assets': '/src/assets'
    }
  }
});
```

**Before**:
```javascript
import { formatDate } from '../../../utils/formatters';
```

**After**:
```javascript
import { formatDate } from '@utils/formatters';
```

---

### 4. Component Organization

**Future consideration** (when project grows to 5+ pages or 20+ components):

```
src/components/
+-- common/            # Shared across entire app
|   +-- Button/
|   +-- Card/
|   +-- Modal/
+-- layout/            # Layout components
|   +-- Header.jsx
|   +-- Footer.jsx
+-- feedback/          # User feedback
|   +-- ErrorDisplay.jsx
|   +-- LoadingProgress.jsx
+-- results/           # Feature-specific (already exists)
```

---

## Technical Decisions

### AI SDK Analysis

**Decision**: Maintain current OpenAI SDK implementation instead of migrating to Vercel AI SDK.

**Reasons**:
1. **Simplicity**: Current implementation is straightforward and maintainable
2. **No Missing Features**: AI SDK's strengths (agents, tools, streaming) are not needed
3. **Performance**: Lighter bundle size (62KB vs 167KB)
4. **Cost-Effective**: No migration costs, no additional complexity
5. **Working Well**: Current solution meets all requirements

**When to Reconsider**:
- Adding chat-based trip planning
- Interactive itinerary refinement
- Dynamic tool calling for real-time data
- Multi-provider AI support

### CSS Approach

**Decision**: Continue using vanilla CSS instead of CSS-in-JS or Tailwind.

**Reasons**:
- Project requirements specify no Tailwind
- CSS-in-JS adds bundle overhead
- Current CSS organization is functional
- Mobile-first approach works well

**Future**: Consider CSS consolidation into `src/styles/` directory for better organization.

---

## Code Quality Metrics

### Current State

| Metric | Value | Target |
|--------|-------|--------|
| ESLint errors | 0 | 0 |
| Build warnings | 0 | 0 |
| Component size | < 300 lines | < 250 lines |
| Directory depth | 3-4 levels | Max 4 levels |

### Bundle Size

| Chunk | Size (gzipped) |
|-------|----------------|
| Main bundle | ~150-200KB |
| React vendor | ~130-150KB |
| OpenAI SDK | ~80-100KB |
| Total | ~350-450KB |

---

## Implementation Priority

### High Priority
1. API Module Duplication - Create `apiClient.js` utility (~150 lines reduction)
2. Planning.jsx Complexity - Extract form components and `useTripPlanningForm` hook

### Medium Priority
1. One-way trip option (Planning.jsx)
2. FlightCard/HotelCard - Create generic `RecommendationCard`
3. Mixed Icon Usage - Standardize on `Icon` component
4. Inconsistent Error Patterns - Standardize API error handling
5. Missing `useDebounce` Hook - Extract common debounce logic

### Low Priority
1. Missing icons (ResultsSidebar.jsx)
2. Unsplash backend endpoints
3. TravelTips/PackingList duplication
4. calculateDuration extraction
5. Storage key inconsistency
6. Magic numbers
7. Console.log cleanup
8. CSS consolidation
9. Path aliases

---

## Anti-Patterns to Avoid

1. **Over-nesting directories** (more than 4 levels)
2. **Generic names** for specific components (Wrapper.jsx, Container.jsx)
3. **Mixing test files** with source files
4. **CSS-in-JS mixing** with CSS files (pick one approach)
5. **Premature optimization** (feature folders for 3 pages)
