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
        const result = await streamText({
            model: openai('gpt-4o-2024-08-06'),
            system: 'You are an expert travel planner. Create detailed, personalized travel itineraries that consider weather conditions, budget constraints, and traveler preferences. Provide practical, actionable recommendations with realistic cost estimates in USD.',
            prompt: context,
            temperature: 0.7,
            maxTokens: 2500
        });

        // Collect the streamed response with incremental parsing
        let fullText = '';

        // Stream text chunks and accumulate
        for await (const textPart of result.textStream) {
            fullText += textPart;

            // Try to parse partial JSON to provide incremental updates
            if (onUpdate && typeof onUpdate === 'function') {
                const partialData = tryParsePartialJSON(fullText);
                onUpdate({
                    streaming: true,
                    partialLength: fullText.length,
                    partialData: partialData
                });
            }
        }

        console.log('Successfully streamed trip plan text, now parsing as JSON...');

        // Parse the complete text as JSON
        // Try to extract JSON from markdown code blocks if present
        let jsonText = fullText.trim();

        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Parse JSON
        let parsedObject;
        try {
            parsedObject = JSON.parse(jsonText);
            console.log('Successfully parsed JSON from streaming response');
        } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            console.error('Raw text (first 500 chars):', jsonText.substring(0, 500));
            throw parseError;
        }

        // Try to validate against schema, but don't fail if validation errors occur
        // The non-streaming API might return data in a slightly different format
        try {
            const validated = TripPlanSchema.parse(parsedObject);
            console.log('Successfully generated and validated trip plan with streaming');

            return {
                success: true,
                ...validated,
                rawWeatherData: weather,
                rawFlightData: flights,
                rawHotelData: hotels
            };
        } catch (validationError) {
            console.warn('Zod validation failed for streaming response, using raw parsed object:', validationError);

            // Return the parsed object anyway - it might still be usable
            return {
                success: true,
                ...parsedObject,
                rawWeatherData: weather,
                rawFlightData: flights,
                rawHotelData: hotels
            };
        }

    } catch (error) {
        console.error('Error generating trip plan with streaming:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

/**
 * Try to parse partial JSON from streaming response
 * Attempts to extract complete objects as they become available
 * @param {string} text - Partial JSON text
 * @returns {Object|null} Parsed partial data or null
 */
function tryParsePartialJSON(text) {
    try {
        // Remove markdown code blocks if present
        let jsonText = text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Try to find valid JSON by looking for opening brace and attempting parse
        if (!jsonText.startsWith('{')) {
            const braceIndex = jsonText.indexOf('{');
            if (braceIndex === -1) return null;
            jsonText = jsonText.substring(braceIndex);
        }

        // Attempt to parse as-is first
        try {
            return JSON.parse(jsonText);
        } catch {
            // If it fails, try to close incomplete objects/arrays
            // Look for complete sections (summary, destination, selectedFlight, etc.)
            const partial = {};

            // Extract summary if complete
            const summaryMatch = jsonText.match(/"summary"\s*:\s*"([^"]+)"/);
            if (summaryMatch) {
                partial.summary = summaryMatch[1];
            }

            // Extract destination if complete
            const destMatch = jsonText.match(/"destination"\s*:\s*"([^"]+)"/);
            if (destMatch) {
                partial.destination = destMatch[1];
            }

            // Extract trip duration if complete
            const durationMatch = jsonText.match(/"tripDuration"\s*:\s*(\d+)/);
            if (durationMatch) {
                partial.tripDuration = parseInt(durationMatch[1], 10);
            }

            // Extract selected flight if section is complete
            const flightMatch = jsonText.match(/"selectedFlight"\s*:\s*(\{[^}]*\})/);
            if (flightMatch) {
                try {
                    partial.selectedFlight = JSON.parse(flightMatch[1]);
                } catch {
                    // Incomplete flight object
                }
            }

            // Extract selected hotel if section is complete
            const hotelMatch = jsonText.match(/"selectedHotel"\s*:\s*(\{[^}]*\})/);
            if (hotelMatch) {
                try {
                    partial.selectedHotel = JSON.parse(hotelMatch[1]);
                } catch {
                    // Incomplete hotel object
                }
            }

            // Extract daily itinerary items if available
            // This is complex - for now just indicate if we're in itinerary section
            if (jsonText.includes('"dailyItinerary"')) {
                // Try to extract complete day objects
                const dayMatches = jsonText.match(/"day"\s*:\s*\d+[^}]*\}/g);
                if (dayMatches && dayMatches.length > 0) {
                    partial.dailyItineraryCount = dayMatches.length;
                }
            }

            // Only return if we have at least one field
            return Object.keys(partial).length > 0 ? partial : null;
        }
    } catch {
        return null;
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
    context += `7. Suggest local restaurants and cuisine experiences\n\n`;

    context += `IMPORTANT: Respond with ONLY valid JSON matching this exact structure (no markdown, no code blocks, just raw JSON):\n`;
    context += `{\n`;
    context += `  "summary": "Brief trip overview",\n`;
    context += `  "destination": "Paris",\n`;
    context += `  "tripDuration": ${days},\n`;
    context += `  "selectedFlight": { "outboundDetails": "Flight details", "returnDetails": "Return flight", "totalCost": 250.33, "airline": "6X" },\n`;
    context += `  "selectedHotel": { "name": "Hotel Name", "rating": 4, "location": "Paris", "totalCost": 500, "amenities": ["WiFi", "Breakfast"] },\n`;
    context += `  "dailyItinerary": [\n`;
    context += `    {\n`;
    context += `      "day": 1,\n`;
    context += `      "date": "YYYY-MM-DD",\n`;
    context += `      "weather": { "temperature": "15°C", "condition": "Sunny", "description": "Clear skies", "recommendation": "Perfect for outdoor activities" },\n`;
    context += `      "activities": [\n`;
    context += `        { "time": "09:00", "name": "Activity Name", "description": "Details", "estimatedCost": 20, "weatherDependent": false }\n`;
    context += `      ],\n`;
    context += `      "meals": [\n`;
    context += `        { "type": "Breakfast", "suggestion": "Café", "cuisine": "French", "estimatedCost": 15 }\n`;
    context += `      ]\n`;
    context += `    }\n`;
    context += `  ],\n`;
    context += `  "budgetAnalysis": { "flights": 250, "accommodation": 500, "activities": 300, "meals": 400, "transportation": 100, "miscellaneous": 50, "total": 1600 },\n`;
    context += `  "travelTips": ["Tip 1", "Tip 2"],\n`;
    context += `  "packingRecommendations": ["Item 1", "Item 2"]\n`;
    context += `}\n`;

    return context;
}
