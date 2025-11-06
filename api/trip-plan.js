/**
 * Vercel Serverless Function for Trip Planning
 * Handles OpenAI API calls to generate trip plans
 */

import OpenAI from 'openai';

/**
 * Generate trip plan using OpenAI
 */
async function generateTripPlan(params) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { origin, destination, startDate, endDate, budget, travelers, weatherData, flightData, hotelData } = params;

  // Build context for AI
  const context = `
User is planning a trip from ${origin} to ${destination}.
Trip dates: ${startDate} to ${endDate}
Budget: $${budget}
Number of travelers: ${travelers}

Weather forecast for ${destination}:
${JSON.stringify(weatherData, null, 2)}

Available flights:
${JSON.stringify(flightData, null, 2)}

Available hotels:
${JSON.stringify(hotelData, null, 2)}
`;

  const prompt = `Based on the trip details and available options, create a comprehensive trip plan that includes:

1. Best flight option recommendation with reasoning
2. Best hotel option recommendation with reasoning
3. Day-by-day itinerary suggestions based on weather and local attractions
4. Packing recommendations based on weather forecast
5. Budget breakdown and tips
6. Local tips and important travel information

Keep recommendations practical and within the user's budget. Format the response in clear sections.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert travel advisor who creates personalized, practical trip plans.'
      },
      {
        role: 'user',
        content: `${context}\n\n${prompt}`
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return completion.choices[0].message.content;
}

/**
 * Main handler for Vercel serverless function
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      origin,
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      weatherData,
      flightData,
      hotelData
    } = req.body;

    // Validate required fields
    if (!origin || !destination || !startDate || !endDate || !budget || !travelers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate trip plan
    const tripPlan = await generateTripPlan({
      origin,
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      weatherData,
      flightData,
      hotelData
    });

    // Return results
    return res.status(200).json({
      success: true,
      data: {
        plan: tripPlan
      }
    });

  } catch (error) {
    console.error('Trip Plan API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate trip plan'
    });
  }
}
