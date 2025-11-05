/**
 * Streaming Trip Plan API Module
 * Handles trip plan generation using OpenAI Streaming API
 * Uses streamText from AI SDK for real-time incremental updates
 */

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
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
        airline: z.string()
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

/**
 * Generate a trip plan using streaming for real-time updates
 * @param {Object} data - Collected trip data
 * @param {Object} data.weather - Weather data
 * @param {Object} data.flights - Flight data
 * @param {Object} data.hotels - Hotel data
 * @param {Object} data.tripData - Original trip form data
 * @param {Function} onUpdate - Callback for partial updates
 * @returns {Promise<Object>} Generated trip plan
 */
export async function generateTripPlanStreaming(data, onUpdate) {
    try {
        // Check if OpenAI API key is configured
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
            console.warn('OpenAI not configured. Skipping streaming generation.');
            return null;
        }

        const { weather, flights, hotels, tripData } = data;

        // Prepare the context for OpenAI
        const context = prepareAIContext(weather, flights, hotels, tripData);

        console.log('Generating trip plan with streaming...');

        // Create OpenAI client
        const openai = createOpenAI({
            apiKey: apiKey,
            compatibility: 'strict'
        });

        // Stream the response with structured output
        const result = streamText({
            model: openai('gpt-4o-2024-08-06'),
            system: 'You are an expert travel planner. Create detailed, personalized travel itineraries that consider weather conditions, budget constraints, and traveler preferences. Provide practical, actionable recommendations with realistic cost estimates in USD.',
            prompt: context,
            temperature: 0.7,
            maxTokens: 2500,
            // Request structured JSON output
            output: 'object',
            schema: TripPlanSchema
        });

        // Collect the streamed response
        let partialData = {};

        // Stream text chunks
        for await (const textPart of result.textStream) {
            // Try to parse as partial JSON
            try {
                const partial = JSON.parse(textPart);
                partialData = { ...partialData, ...partial };

                // Call update callback with partial data
                if (onUpdate && typeof onUpdate === 'function') {
                    onUpdate(partialData);
                }
            } catch {
                // Not yet valid JSON, continue streaming
            }
        }

        // Wait for final result
        const finalResult = await result.response;
        const parsedObject = await finalResult.json();

        console.log('Successfully generated trip plan with streaming');

        return {
            success: true,
            ...parsedObject,
            rawWeatherData: weather,
            rawFlightData: flights,
            rawHotelData: hotels
        };

    } catch (error) {
        console.error('Error generating trip plan with streaming:', error);
        throw error;
    }
}

/**
 * Prepare context string for OpenAI API
 * @param {Object} weather - Weather data
 * @param {Object} flights - Flight data
 * @param {Object} hotels - Hotel data
 * @param {Object} tripData - Original trip data
 * @returns {string} Context string for AI
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
