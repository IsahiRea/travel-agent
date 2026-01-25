# Refactoring & Technical Debt

TODOs, completed optimizations, and future improvement opportunities.

## Status Overview

| Category | Status |
|----------|--------|
| Progressive Loading | Completed |
| AI Streaming | Completed |
| Constants Directory | Completed |
| API Client Utility | Completed |
| Planning.jsx Refactor | Completed |
| Remaining TODOs | 4 items |
| Code Duplication | 4 opportunities remaining |
| Large Components | 1 component needs splitting |
| Missing Abstractions | 1 hook to create |

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

### 3. API Client Utility

**Summary**: Created centralized API client utility to eliminate code duplication across API modules.

**File Created**: `src/utils/apiClient.js`

**Functions**:
- `apiPost()` - Standardized POST requests with error handling
- `apiGet()` - Standardized GET requests with optional empty-array fallback
- `withErrorHandling()` - Wrapper for consistent error response format

**Files Refactored**:
- `src/apis/flightApi.backend.js` (100 → 62 lines)
- `src/apis/hotelApi.backend.js` (55 → 31 lines)
- `src/apis/weatherApi.backend.js` (53 → 29 lines)
- `src/apis/tripPlanApi.backend.js` (57 → 33 lines)
- `src/apis/unsplashApi.backend.js` (65 → 52 lines)

**Code Reduction**: ~120 lines of duplicated code eliminated.

---

### 4. Planning.jsx Complexity Reduction

**Summary**: Extracted form state management and UI components from Planning.jsx.

**Before**: 430 lines with 7 state variables, validation logic, and complex JSX.

**After**: 247 lines using custom hook and extracted components.

**Files Created**:
- `src/hooks/useTripPlanningForm.js` - Form state, validation, and actions (156 lines)
- `src/components/planning/TravelerCounter.jsx` - Traveler counter component (61 lines)
- `src/components/planning/DateSelectionSection.jsx` - Date inputs with conditional rendering (95 lines)
- `src/components/planning/index.js` - Re-exports

**Benefits**:
- Better separation of concerns
- Reusable form logic via custom hook
- Easier to test individual components
- More maintainable codebase

---

### 5. Constants Directory

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

### HIGH Priority - COMPLETED

#### 1. API Module Duplication - COMPLETED

**Status**: Implemented in `src/utils/apiClient.js`

Created `apiPost()`, `apiGet()`, and `withErrorHandling()` utilities. All API modules now use the shared client, reducing ~120 lines of duplicated code.

---

#### 2. Planning.jsx Complexity - COMPLETED

**Status**: Refactored with custom hook and extracted components.

- Created `useTripPlanningForm` hook for form state management
- Extracted `TravelerCounter` and `DateSelectionSection` components
- Planning.jsx reduced from 430 to 247 lines

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

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Code Duplication | ~200 lines | ~80 lines | Improved |
| Avg Component Size | 150 lines | 80-100 lines | Improved |
| API Module Lines | ~400 total | ~210 total | Improved |
| Reusable Hooks | 4 | 5 | Improved |
| Utility Functions | 6 | 9 | Improved |
| Planning.jsx | 430 lines | 247 lines | Improved |

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

### High Priority - COMPLETED
1. ~~API Module Duplication - Create `apiClient.js` utility~~ (Done)
2. ~~Planning.jsx Complexity - Extract form components and `useTripPlanningForm` hook~~ (Done)

### Medium Priority
1. One-way trip option (Planning.jsx) - Already implemented via trip type toggle
2. FlightCard/HotelCard - Create generic `RecommendationCard`
3. Mixed Icon Usage - Standardize on `Icon` component
4. Missing `useDebounce` Hook - Extract common debounce logic

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
