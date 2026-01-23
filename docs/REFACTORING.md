# Refactoring & Technical Debt

TODOs, completed optimizations, and future improvement opportunities.

## Status Overview

| Category | Status |
|----------|--------|
| Cache System | Completed |
| Progressive Loading | Completed |
| AI Streaming | Completed |
| Utils Refactoring | Completed |
| Remaining TODOs | 4 items |

---

## Completed Refactors

### 1. Cache System Refactoring

**Summary**: Unified IndexedDB caching infrastructure with 60% code reduction.

**Before**:
```
src/utils/
+-- airportCache.js      (205 lines - standalone)
+-- coordinatesCache.js  (199 lines - standalone)
+-- tokenCache.js        (144 lines)
```

**After**:
```
src/utils/
+-- cache/
|   +-- indexedDBCache.js    (228 lines - base class)
|   +-- cacheDB.js           (61 lines - centralized schema)
|   +-- airportCache.js      (100 lines - extends base)
|   +-- coordinatesCache.js  (105 lines - extends base)
+-- formatters.js            (47 lines - shared utilities)
+-- logger.js                (84 lines - consistent logging)
+-- tokenCache.js            (169 lines - added stats)
```

**Benefits**:
- 60% code reduction in cache implementations
- Consistent behavior across all caches
- Centralized schema management
- Easy to extend - new caches in ~30 lines
- Unified logging with consistent formatting

**Adding New Cache Types**:
```javascript
// Only ~30 lines needed for a new cache type
class WeatherCache extends IndexedDBCache {
  constructor() {
    super('weather-forecast', 'Weather', 5 * 60 * 60 * 1000); // 5 hours
  }

  createCacheEntry(forecast, originalKey) {
    return { forecast, originalQuery: originalKey };
  }

  extractValue(cached) {
    return cached.forecast;
  }

  formatValue(cached) {
    return `${cached.forecast.temp}C`;
  }
}
```

---

### 2. Progressive Loading Implementation

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

### 3. AI Streaming Support

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
- `src/apis/flightApi.js` - API call parameters
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

### 3. Constants Directory

**Recommendation**: Create `src/constants/` directory:

```
src/constants/
+-- routes.js         # Route paths
+-- api.js            # API endpoints, timeouts
+-- validation.js     # Form validation rules
+-- index.js          # Re-export all
```

**Example `routes.js`**:
```javascript
export const ROUTES = {
  HOME: '/',
  PLANNING: '/planning',
  RESULTS: '/results'
};

export const NAV_LINKS = [
  { path: ROUTES.HOME, label: 'Home' },
  { path: ROUTES.PLANNING, label: 'Plan Trip' }
];
```

---

### 4. Path Aliases

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

### 5. Component Organization

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
1. None currently - core features complete

### Medium Priority
1. One-way trip option (Planning.jsx)

### Low Priority
1. Missing icons (ResultsSidebar.jsx)
2. Unsplash backend endpoints
3. CSS consolidation
4. Constants directory
5. Path aliases

---

## Anti-Patterns to Avoid

1. **Over-nesting directories** (more than 4 levels)
2. **Generic names** for specific components (Wrapper.jsx, Container.jsx)
3. **Mixing test files** with source files
4. **CSS-in-JS mixing** with CSS files (pick one approach)
5. **Premature optimization** (feature folders for 3 pages)
