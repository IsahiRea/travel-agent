/**
 * Vercel Serverless Function for Trip Planning
 * API keys are SECURE on the server
 */

import OpenAI from 'openai';
import { z } from 'zod';

/**
 * Zod Schema for Activity
 */
const ActivitySchema = z.object({
    time: z.string(),
    name: z.string(),
    description: z.string(),
    estimatedCost: z.number(),
    weatherDependent: z.boolean()
});

/**
 * Zod Schema for Meal Suggestion
 */
const MealSchema = z.object({
    type: z.enum(['Breakfast', 'Lunch', 'Dinner']),
    suggestion: z.string(),
    cuisine: z.string(),
    estimatedCost: z.number()
});

/**
 * Zod Schema for Daily Weather
 */
const DailyWeatherSchema = z.object({
    temperature: z.string(),
    condition: z.string(),
    description: z.string(),
    recommendation: z.string()
});

/**
 * Zod Schema for Daily Itinerary
 */
const DailyItinerarySchema = z.object({
    day: z.number(),
    date: z.string(),
    weather: DailyWeatherSchema,
    activities: z.array(ActivitySchema),
    meals: z.array(MealSchema)
});

/**
 * Zod Schema for Budget Breakdown
 */
const BudgetBreakdownSchema = z.object({
    flights: z.number(),
    accommodation: z.number(),
    activities: z.number(),
    meals: z.number(),
    transportation: z.number(),
    miscellaneous: z.number(),
    total: z.number()
});

/**
 * Zod Schema for Complete Trip Plan
 */
const TripPlanSchema = z.object({
    summary: z.string(),
    destination: z.string(),
    tripDuration: z.number(),
    selectedFlight: z.object({
        outboundDetails: z.string(),
        returnDetails: z.string(),
        totalCost: z.number(),
        airline: z.string(),
        flightId: z.string().optional(),
        originCode: z.string().optional(),
        destinationCode: z.string().optional(),
        departureTime: z.string().optional(),
        arrivalTime: z.string().optional(),
        stops: z.number().optional(),
        returnOriginCode: z.string().optional(),
        returnDestinationCode: z.string().optional(),
        returnDepartureTime: z.string().optional(),
        returnArrivalTime: z.string().optional()
    }),
    selectedHotel: z.object({
        name: z.string(),
        rating: z.number(),
        location: z.string(),
        totalCost: z.number(),
        amenities: z.array(z.string())
    }),
    dailyItinerary: z.array(DailyItinerarySchema),
    budgetAnalysis: BudgetBreakdownSchema,
    travelTips: z.array(z.string()),
    packingRecommendations: z.array(z.string())
});

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
    // ✅ API key is SECURE - read from environment on server
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY  // Never exposed to browser!
    });

    const { weather, flights, hotels, tripData } = req.body;

    // Validate input
    if (!tripData || !tripData.arriveAt || !tripData.departDate || !tripData.returnDate || !tripData.budget) {
      return res.status(400).json({ error: 'Missing required trip data fields' });
    }

    // Prepare AI context
    const context = prepareAIContext(weather, flights, hotels, tripData);

    console.log('Generating trip plan with OpenAI...');

    // Dynamically import zodResponseFormat helper
    const { zodResponseFormat } = await import('openai/helpers/zod');

    // Call OpenAI API with secure key and structured output
    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner. Create detailed, personalized travel itineraries that consider weather conditions, budget constraints, and traveler preferences. Provide practical, actionable recommendations with realistic cost estimates in USD.'
        },
        {
          role: 'user',
          content: context
        }
      ],
      response_format: zodResponseFormat(TripPlanSchema, 'trip_plan'),
      temperature: 0.7,
      max_tokens: 2500
    });

    const message = completion.choices[0]?.message;

    if (message?.parsed) {
      console.log('Successfully generated trip plan with OpenAI');
      return res.status(200).json({
        success: true,
        data: {
          ...message.parsed,
          rawWeatherData: weather,
          rawFlightData: flights,
          rawHotelData: hotels
        }
      });
    } else if (message?.refusal) {
      console.error('OpenAI refused to generate trip plan:', message.refusal);
      return res.status(500).json({
        error: 'Unable to generate trip plan: ' + message.refusal
      });
    } else {
      return res.status(500).json({
        error: 'No parsed response from OpenAI'
      });
    }

  } catch (error) {
    console.error('Trip Plan API Error:', error);
    return res.status(500).json({
      error: 'Failed to generate trip plan'
    });
  }
}

/**
 * Prepare context string for OpenAI API
 */
function prepareAIContext(weather, flights, hotels, tripData) {
  const { travelers, departFrom, arriveAt, departDate, returnDate, budget } = tripData;

  const startDate = new Date(departDate);
  const endDate = new Date(returnDate);
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  let context = `Create a comprehensive travel plan for the following trip:\n\n`;
  context += `TRIP DETAILS:\n`;
  context += `- Travelers: ${travelers} person${travelers > 1 ? 's' : ''}\n`;
  context += `- Route: ${departFrom} → ${arriveAt}\n`;
  context += `- Dates: ${departDate} to ${returnDate} (${days} days)\n`;
  context += `- Budget: $${budget} USD total\n\n`;

  // Add weather information
  if (weather?.forecast && weather.forecast.length > 0) {
    context += `WEATHER FORECAST:\n`;
    context += `${weather.summary}\n`;
    weather.forecast.forEach(day => {
      context += `- ${day.date}: ${day.tempMin}-${day.tempMax}°C, ${day.description}`;
      if (day.precipitation) context += ` (rain expected)`;
      context += `\n`;
    });
    context += `\n`;
  }

  // Add flight options
  if (flights?.flights && flights.flights.length > 0) {
    context += `AVAILABLE FLIGHTS (select the best value option):\n`;
    flights.flights.slice(0, 3).forEach((flight, idx) => {
      context += `Option ${idx + 1}: ${flight.airline} - $${flight.price.total} USD\n`;
      context += `  Outbound: ${flight.outbound.departure.airport} → ${flight.outbound.arrival.airport}\n`;
      if (flight.return) {
        context += `  Return: ${flight.return.departure.airport} → ${flight.return.arrival.airport}\n`;
      }
    });
    context += `\n`;
  }

  // Add hotel options
  if (hotels?.hotels && hotels.hotels.length > 0) {
    context += `AVAILABLE HOTELS (select the best value option within budget):\n`;
    hotels.hotels.slice(0, 3).forEach((hotel, idx) => {
      context += `Option ${idx + 1}: ${hotel.name} (${hotel.rating}★) - $${hotel.price.total} USD total\n`;
      context += `  Location: ${hotel.location.address?.cityName || arriveAt}\n`;
      if (hotel.amenities && hotel.amenities.length > 0) {
        context += `  Amenities: ${hotel.amenities.slice(0, 3).join(', ')}\n`;
      }
    });
    context += `\n`;
  }

  context += `REQUIREMENTS:\n`;
  context += `1. Select ONE flight and ONE hotel that provide the best value within the budget\n`;
  context += `2. Create a day-by-day itinerary with activities suited to the weather\n`;
  context += `3. Suggest indoor activities for rainy days and outdoor activities for good weather\n`;
  context += `4. Provide realistic cost estimates for all activities and meals\n`;
  context += `5. Ensure the total estimated cost stays within the $${budget} budget\n`;
  context += `6. Include practical travel tips and packing recommendations\n`;
  context += `7. Suggest local restaurants and cuisine experiences\n`;

  return context;
}
