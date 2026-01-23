# API Key Security & Authentication

Guide to protecting API keys and implementing secure backend patterns.

## The Problem

### Current State (Insecure)

When API keys are stored in frontend code with the `VITE_` prefix, they are:

- **Exposed in the browser** - Anyone can view them in:
  - Developer console
  - Network tab
  - JavaScript bundle
  - Browser storage

- **Publicly accessible** - Users can:
  - Extract your API keys
  - Use them for their own projects
  - Cause unexpected API costs
  - Potentially exhaust rate limits

### Example of Insecure Code

```javascript
// INSECURE - Frontend code with exposed API key
const apiKey = import.meta.env.VITE_OPENAI_API_KEY; // Visible in browser!

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${apiKey}` // Key exposed in network requests
  }
});
```

---

## The Solution

### Serverless Functions Architecture

Use **Vercel Serverless Functions** to keep API keys secure on the server:

- API keys stay on server - never sent to browser
- Zero additional cost - included in Vercel free tier
- Auto-scaling - handles traffic automatically
- Simple deployment - deploys with your frontend

### Architecture Diagram

```
User Browser                  Vercel Serverless           External API
    |                         Function (Backend)              |
    |                                                         |
    |  1. POST /api/trip-plan                                |
    |     { destination, dates }                             |
    |---------------------------->                           |
    |                         |                              |
    |                         |  2. Read process.env         |
    |                         |     OPENAI_API_KEY           |
    |                         |     (SECURE - never exposed) |
    |                         |                              |
    |                         |  3. POST with API key        |
    |                         |----------------------------->|
    |                         |                              |
    |                         |  4. Return data              |
    |                         |<-----------------------------|
    |                         |                              |
    |  5. Return safe data    |                              |
    |<------------------------|                              |
    |                                                         |

API Key NEVER leaves the server
User only sees trip plan data
```

---

## Implementation

### Project Structure

```
your-project/
+-- api/                          # Backend serverless functions
|   +-- flights.js               # Flight search endpoint
|   +-- hotels.js                # Hotel search endpoint
|   +-- weather.js               # Weather data endpoint
|   +-- trip-plan.js             # AI trip planning endpoint
+-- src/
|   +-- apis/                    # Frontend API clients
|   |   +-- flightApi.js         # Calls /api/flights
|   |   +-- hotelApi.js          # Calls /api/hotels
|   |   +-- weatherApi.js        # Calls /api/weather
|   |   +-- tripPlanApi.js       # Calls /api/trip-plan
|   +-- ...
+-- .env                         # Server-side secrets (NO VITE_ prefix)
+-- vercel.json                  # Deployment configuration
```

### Environment Variables

**Old Way (Insecure)**:
```bash
# .env - EXPOSED TO BROWSER
VITE_OPENAI_API_KEY=sk-proj-xxxxx
VITE_AMADEUS_API_KEY=xxxxx
VITE_AMADEUS_API_SECRET=xxxxx
```

**New Way (Secure)**:
```bash
# .env - SECURE (server-side only, NO VITE_ prefix)
OPENAI_API_KEY=sk-proj-xxxxx
AMADEUS_API_KEY=xxxxx
AMADEUS_API_SECRET=xxxxx
OPENWEATHER_API_KEY=xxxxx
```

**Key Difference**: Removing the `VITE_` prefix ensures these variables are NOT bundled into the browser JavaScript.

---

## Vercel Functions Examples

### Trip Plan Endpoint

```javascript
// api/trip-plan.js
import OpenAI from 'openai';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // API key is SECURE - read from environment on server
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY  // Never exposed to browser!
    });

    const { destination, startDate, endDate, budget } = req.body;

    // Validate input
    if (!destination || !startDate || !endDate || !budget) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Call OpenAI API with secure key
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a travel planning assistant.' },
        { role: 'user', content: `Plan a trip to ${destination}...` }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Return only the safe data to frontend
    return res.status(200).json({
      success: true,
      data: { plan: completion.choices[0].message.content }
    });

  } catch (error) {
    console.error('Trip Plan API Error:', error);
    return res.status(500).json({ error: 'Failed to generate trip plan' });
  }
}
```

### Flights Endpoint with Token Management

```javascript
// api/flights.js

// In-memory token cache
let tokenCache = { token: null, expiresAt: null };

async function getAmadeusToken() {
  // Check cache
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  // Get new token - Credentials SECURE on server
  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_API_KEY,      // SECURE
      client_secret: process.env.AMADEUS_API_SECRET, // SECURE
    }),
  });

  const data = await response.json();

  // Cache token
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return data.access_token;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { origin, destination, departureDate, returnDate, adults } = req.body;

    // Validate
    if (!origin || !destination || !departureDate || !returnDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get secure token
    const token = await getAmadeusToken();

    // Call Amadeus API
    const response = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?...`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const flightData = await response.json();

    return res.status(200).json({ success: true, data: flightData });

  } catch (error) {
    console.error('Flight API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch flights' });
  }
}
```

### Frontend Client (No API Keys)

```javascript
// src/apis/tripPlanApi.js
export async function generateTripPlan(tripData) {
  try {
    // NO API KEY in frontend code
    const response = await fetch('/api/trip-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        budget: tripData.budget,
      })
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, plan: result.data.plan };

  } catch (error) {
    console.error('Error calling backend:', error);
    return { success: false, error: error.message };
  }
}
```

---

## Vercel Deployment

### Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Setting Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Navigate to **Settings** -> **Environment Variables**
4. Add each variable:

```
OPENAI_API_KEY         = sk-proj-xxxxx
AMADEUS_API_KEY        = xxxxx
AMADEUS_API_SECRET     = xxxxx
OPENWEATHER_API_KEY    = xxxxx
```

**Important**:
- Select **Production**, **Preview**, and **Development** environments
- Do NOT add `VITE_` prefix
- Click **Save** after each variable

### Local Development

```bash
# Install Vercel CLI
npm install -g vercel

# Link project
vercel link

# Pull environment variables
vercel env pull

# Start development server (runs serverless functions locally)
vercel dev
```

---

## Best Practices

### 1. Never Log Secrets

```javascript
// BAD - Logs API key
console.log('Using key:', process.env.OPENAI_API_KEY);

// GOOD - Logs only confirmation
console.log('API key configured:', !!process.env.OPENAI_API_KEY);
```

### 2. Validate All Inputs

```javascript
export default async function handler(req, res) {
  // Always validate user input
  if (!req.body.destination || typeof req.body.destination !== 'string') {
    return res.status(400).json({ error: 'Invalid destination' });
  }

  // Sanitize input
  const destination = req.body.destination.trim().slice(0, 100);

  // ... rest of logic
}
```

### 3. Implement Rate Limiting

```javascript
// Simple in-memory rate limiter
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const record = rateLimitMap.get(ip);

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // ... rest of logic
}
```

### 4. Restrict CORS in Production

```javascript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://your-domain.com']
  : ['http://localhost:3000'];

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ... rest of logic
}
```

### 5. Handle Errors Gracefully

```javascript
export default async function handler(req, res) {
  try {
    // Your logic here
  } catch (error) {
    console.error('API Error:', error);

    // DON'T expose internal errors
    // return res.status(500).json({ error: error.message });

    // DO return generic user-friendly message
    return res.status(500).json({
      error: 'An error occurred while processing your request'
    });
  }
}
```

---

## Migration Checklist

- [ ] Create `/api` directory for serverless functions
- [ ] Remove `VITE_` prefix from sensitive environment variables
- [ ] Move API calls from frontend to backend functions
- [ ] Update frontend to call `/api/*` endpoints
- [ ] Set environment variables in Vercel dashboard
- [ ] Test locally with `vercel dev`
- [ ] Deploy and verify in production
- [ ] Check browser DevTools - no API keys visible

---

## Troubleshooting

### "process is not defined" Error

**Cause**: Using `process.env` in frontend code

**Solution**: Only use `process.env` in `/api` directory

### Environment Variables Not Working

**Checklist**:
- Variables set in Vercel dashboard?
- Selected all environments (Production/Preview/Development)?
- Redeployed after adding variables?
- Running `vercel dev` (not `npm run dev`)?

### CORS Errors

**Solution**: Add CORS headers to serverless function:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### Function Timeout

- **Default**: 10 seconds
- **Max (Free tier)**: 10 seconds
- **Max (Pro tier)**: 60 seconds

**Solution**: Optimize API calls or upgrade plan

---

## Cost Comparison

### Vercel Free Tier Limits

- 100 GB-hours serverless functions/month (~360,000 invocations)
- 100 GB bandwidth
- Unlimited deployments
- Edge Functions included

### Result

Vercel serverless = **$0** for most projects

---

## Security Verification

### How to Verify Keys Are Protected

1. Open Browser DevTools -> Network Tab
2. Make a request from your app
3. Check request headers - Should see NO API keys
4. Check response - Should only contain trip data

**Correct**: Headers show only `/api/trip-plan` request with JSON body
**Incorrect**: If you see API keys anywhere, they're exposed!

---

## Resources

- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
