/**
 * Vercel Serverless Function for Streaming Trip Planning
 * Uses AI SDK's streamText with Server-Sent Events
 * API keys are SECURE on the server
 */

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

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
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const { weather, flights, hotels, tripData } = req.body;

    // Validate input
    if (!tripData || !tripData.arriveAt || !tripData.departDate || !tripData.returnDate || !tripData.budget) {
      return res.status(400).json({ error: 'Missing required trip data fields' });
    }

    // Prepare AI context
    const context = prepareAIContext(weather, flights, hotels, tripData);

    console.log('Generating trip plan with streaming...');

    // Create OpenAI client
    const openai = createOpenAI({
      apiKey: apiKey,
      compatibility: 'strict'
    });

    // Stream the response with AI SDK
    const result = await streamText({
      model: openai('gpt-4o-2024-08-06'),
      system: 'You are an expert travel planner. Create detailed, personalized travel itineraries that consider weather conditions, budget constraints, and traveler preferences. Provide practical, actionable recommendations with realistic cost estimates in USD.',
      prompt: context,
      temperature: 0.7,
      maxTokens: 2500
    });

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the text chunks to the client
    let fullText = '';

    for await (const textPart of result.textStream) {
      fullText += textPart;

      // Send each chunk as a Server-Sent Event
      res.write(`data: ${JSON.stringify({
        type: 'chunk',
        content: textPart,
        accumulated: fullText.length
      })}\n\n`);
    }

    // Parse the complete response as JSON
    let jsonText = fullText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsedObject;
    try {
      parsedObject = JSON.parse(jsonText);
      console.log('Successfully parsed JSON from streaming response');
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Raw text (first 500 chars):', jsonText.substring(0, 500));

      // Send error event
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'Failed to parse AI response as JSON'
      })}\n\n`);
      res.end();
      return;
    }

    // Send the complete parsed result
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      data: {
        success: true,
        ...parsedObject,
        rawWeatherData: weather,
        rawFlightData: flights,
        rawHotelData: hotels
      }
    })}\n\n`);

    // End the stream
    res.end();

  } catch (error) {
    console.error('Trip Plan Streaming API Error:', error);

    // Try to send error through SSE if possible
    try {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message || 'Failed to generate trip plan'
      })}\n\n`);
      res.end();
    } catch {
      // If we can't send SSE, send JSON error
      return res.status(500).json({
        error: error.message || 'Failed to generate trip plan'
      });
    }
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
