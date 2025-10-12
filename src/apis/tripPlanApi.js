/**
 * Trip Plan API Module
 * Handles trip plan generation using OpenAI API
 * API Documentation: https://platform.openai.com/docs/api-reference/chat/create
 */

import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { openai } from '../config.js';

/**
 * Zod Schema for Activity
 */
const ActivitySchema = z.object({
    time: z.string().describe('Time of day for the activity (e.g., "Morning", "Afternoon", "Evening")'),
    name: z.string().describe('Name of the activity'),
    description: z.string().describe('Detailed description of the activity'),
    estimatedCost: z.number().describe('Estimated cost in USD'),
    weatherDependent: z.boolean().describe('Whether this activity depends on good weather')
});

/**
 * Zod Schema for Meal Suggestion
 */
const MealSchema = z.object({
    type: z.enum(['Breakfast', 'Lunch', 'Dinner']).describe('Type of meal'),
    suggestion: z.string().describe('Restaurant or meal suggestion'),
    cuisine: z.string().describe('Type of cuisine'),
    estimatedCost: z.number().describe('Estimated cost per person in USD')
});

/**
 * Zod Schema for Daily Weather
 */
const DailyWeatherSchema = z.object({
    temperature: z.string().describe('Temperature range (e.g., "18-25°C")'),
    condition: z.string().describe('Weather condition (e.g., "Clear", "Rainy")'),
    description: z.string().describe('Detailed weather description'),
    recommendation: z.string().describe('Clothing/preparation recommendation based on weather')
});

/**
 * Zod Schema for Daily Itinerary
 */
const DailyItinerarySchema = z.object({
    day: z.number().describe('Day number of the trip'),
    date: z.string().describe('Date in YYYY-MM-DD format'),
    weather: DailyWeatherSchema,
    activities: z.array(ActivitySchema).describe('List of activities for the day'),
    meals: z.array(MealSchema).describe('Meal suggestions for the day')
});

/**
 * Zod Schema for Budget Breakdown
 */
const BudgetBreakdownSchema = z.object({
    flights: z.number().describe('Total cost for flights'),
    accommodation: z.number().describe('Total cost for hotel accommodation'),
    activities: z.number().describe('Total estimated cost for activities'),
    meals: z.number().describe('Total estimated cost for meals'),
    transportation: z.number().describe('Estimated local transportation costs'),
    miscellaneous: z.number().describe('Buffer for miscellaneous expenses'),
    total: z.number().describe('Total estimated trip cost')
});

/**
 * Zod Schema for Complete Trip Plan
 */
const TripPlanSchema = z.object({
    summary: z.string().describe('Executive summary of the trip plan'),
    destination: z.string().describe('Destination city and country'),
    tripDuration: z.number().describe('Number of days for the trip'),
    selectedFlight: z.object({
        outboundDetails: z.string().describe('Outbound flight summary'),
        returnDetails: z.string().describe('Return flight summary (if applicable)'),
        totalCost: z.number().describe('Total flight cost'),
        airline: z.string().describe('Airline name')
    }),
    selectedHotel: z.object({
        name: z.string().describe('Hotel name'),
        rating: z.number().describe('Hotel star rating'),
        location: z.string().describe('Hotel location description'),
        totalCost: z.number().describe('Total accommodation cost'),
        amenities: z.array(z.string()).describe('Key hotel amenities')
    }),
    dailyItinerary: z.array(DailyItinerarySchema).describe('Day-by-day itinerary'),
    budgetAnalysis: BudgetBreakdownSchema,
    travelTips: z.array(z.string()).describe('Helpful travel tips for the destination'),
    packingRecommendations: z.array(z.string()).describe('What to pack based on weather and activities')
});


/**
 * Generate a trip plan using collected data and OpenAI API
 * @param {Object} data - Collected trip data
 * @param {Object} data.weather - Weather data
 * @param {Object} data.flights - Flight data
 * @param {Object} data.hotels - Hotel data
 * @param {Object} data.tripData - Original trip form data
 * @returns {Promise<Object>} Generated trip plan
 */
export async function generateTripPlan(data) {
    try {
        // Check if OpenAI is configured
        if (!openai) {
            console.warn('OpenAI not configured. Using mock trip plan.');
            return getMockTripPlan(data);
        }

        const { weather, flights, hotels, tripData } = data;

        // Prepare the context for OpenAI
        const context = prepareAIContext(weather, flights, hotels, tripData);

        console.log('Generating trip plan with OpenAI...');

        // Call OpenAI API with structured output
        const completion = await openai.chat.completions.parse({
            model: 'gpt-4o-2024-08-06',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert travel planner. Create detailed, personalized travel itineraries that consider weather conditions, budget constraints, and traveler preferences. Provide practical, actionable recommendations with realistic cost estimates in USD.`
                },
                {
                    role: 'user',
                    content: context
                }
            ],
            response_format: zodResponseFormat(TripPlanSchema, 'trip_plan'),
            temperature: 0.7,
            max_tokens: 4000
        });

        const message = completion.choices[0]?.message;

        if (message?.parsed) {
            console.log('Successfully generated trip plan with OpenAI');
            return {
                success: true,
                ...message.parsed,
                rawWeatherData: weather,
                rawFlightData: flights,
                rawHotelData: hotels
            };
        } else if (message?.refusal) {
            console.error('OpenAI refused to generate trip plan:', message.refusal);
            throw new Error('Unable to generate trip plan: ' + message.refusal);
        } else {
            throw new Error('No parsed response from OpenAI');
        }

    } catch (error) {
        console.error('Error generating trip plan with OpenAI:', error);

        // Check for specific OpenAI errors
        if (error.constructor.name === 'LengthFinishReasonError') {
            console.error('Response was too long');
        } else if (error.constructor.name === 'ContentFilterFinishReasonError') {
            console.error('Content was filtered');
        }

        // Fallback to mock data
        console.warn('Using mock trip plan due to error');
        return getMockTripPlan(data);
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

/**
 * Generate mock trip plan for testing/fallback
 * @param {Object} data - Trip data
 * @returns {Object} Mock trip plan
 */
function getMockTripPlan(data) {
    const { tripData, weather, flights, hotels } = data;
    const { arriveAt, departDate, returnDate, budget, travelers } = tripData;

    const startDate = new Date(departDate);
    const endDate = new Date(returnDate);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Select first available flight and hotel
    const selectedFlight = flights?.flights?.[0] || {
        airline: 'Mock Airlines',
        price: { total: '650.00' },
        outbound: { departure: { airport: 'JFK' }, arrival: { airport: 'CDG' } },
        return: { departure: { airport: 'CDG' }, arrival: { airport: 'JFK' } }
    };

    const selectedHotel = hotels?.hotels?.[0] || {
        name: 'Mock Hotel',
        rating: 4,
        location: { address: { cityName: arriveAt } },
        price: { total: '450.00' },
        amenities: ['WIFI', 'BREAKFAST', 'GYM']
    };

    const flightCost = parseFloat(selectedFlight.price.total);
    const hotelCost = parseFloat(selectedHotel.price.total);

    const dailyItinerary = [];

    for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        const dayWeather = weather?.forecast?.[i] || {
            tempMin: 20,
            tempMax: 25,
            condition: 'Clear',
            description: 'clear sky',
            precipitation: false
        };

        dailyItinerary.push({
            day: i + 1,
            date: dateStr,
            weather: {
                temperature: `${dayWeather.tempMin}-${dayWeather.tempMax}°C`,
                condition: dayWeather.condition,
                description: dayWeather.description,
                recommendation: dayWeather.precipitation
                    ? 'Bring an umbrella and wear waterproof shoes'
                    : 'Light clothing recommended, sunscreen advised'
            },
            activities: [
                {
                    time: 'Morning',
                    name: i === 0 ? 'Hotel Check-in & City Orientation' : 'Local Market Visit',
                    description: i === 0
                        ? 'Arrive at hotel, settle in, and take a walking tour of the neighborhood'
                        : 'Explore local markets and sample regional specialties',
                    estimatedCost: i === 0 ? 0 : 20,
                    weatherDependent: false
                },
                {
                    time: 'Afternoon',
                    name: dayWeather.precipitation ? 'Museum Tour' : 'City Sightseeing',
                    description: dayWeather.precipitation
                        ? 'Visit world-class museums and cultural sites'
                        : 'Explore famous landmarks and historical sites',
                    estimatedCost: 30,
                    weatherDependent: !dayWeather.precipitation
                },
                {
                    time: 'Evening',
                    name: 'Dinner & Local Entertainment',
                    description: 'Experience local cuisine and nightlife',
                    estimatedCost: 50,
                    weatherDependent: false
                }
            ],
            meals: [
                {
                    type: 'Breakfast',
                    suggestion: 'Hotel breakfast or local café',
                    cuisine: 'Local',
                    estimatedCost: 15
                },
                {
                    type: 'Lunch',
                    suggestion: 'Traditional restaurant',
                    cuisine: 'Local specialties',
                    estimatedCost: 25
                },
                {
                    type: 'Dinner',
                    suggestion: 'Fine dining experience',
                    cuisine: 'Local/International',
                    estimatedCost: 50
                }
            ]
        });
    }

    const totalActivityCost = dailyItinerary.reduce((sum, day) =>
        sum + day.activities.reduce((aSum, a) => aSum + a.estimatedCost, 0), 0
    );

    const totalMealCost = dailyItinerary.reduce((sum, day) =>
        sum + day.meals.reduce((mSum, m) => mSum + m.estimatedCost, 0), 0
    );

    const transportationCost = days * 20;
    const miscCost = Math.round(budget * 0.1);

    return {
        success: true,
        summary: `A ${days}-day adventure in ${arriveAt} for ${travelers} traveler${travelers > 1 ? 's' : ''}. This itinerary balances cultural experiences, local cuisine, and weather-appropriate activities while staying within your $${budget} budget.`,
        destination: `${arriveAt}`,
        tripDuration: days,
        selectedFlight: {
            outboundDetails: `${selectedFlight.outbound.departure.airport} to ${selectedFlight.outbound.arrival.airport} via ${selectedFlight.airline}`,
            returnDetails: selectedFlight.return
                ? `${selectedFlight.return.departure.airport} to ${selectedFlight.return.arrival.airport} via ${selectedFlight.airline}`
                : 'One-way flight',
            totalCost: flightCost,
            airline: selectedFlight.airline
        },
        selectedHotel: {
            name: selectedHotel.name,
            rating: selectedHotel.rating,
            location: selectedHotel.location.address?.cityName || arriveAt,
            totalCost: hotelCost,
            amenities: selectedHotel.amenities || ['WIFI', 'BREAKFAST']
        },
        dailyItinerary,
        budgetAnalysis: {
            flights: flightCost,
            accommodation: hotelCost,
            activities: totalActivityCost,
            meals: totalMealCost,
            transportation: transportationCost,
            miscellaneous: miscCost,
            total: flightCost + hotelCost + totalActivityCost + totalMealCost + transportationCost + miscCost
        },
        travelTips: [
            `Best time to visit: Weather forecast shows ${weather?.summary || 'pleasant conditions'}`,
            'Book activities in advance during peak season',
            'Learn a few basic phrases in the local language',
            'Keep copies of important documents',
            'Purchase travel insurance before departure'
        ],
        packingRecommendations: [
            'Comfortable walking shoes',
            weather?.forecast?.some(d => d.precipitation) ? 'Umbrella and rain jacket' : 'Sunscreen and sunglasses',
            'Light layers for changing weather',
            'Universal power adapter',
            'Portable charger for electronics'
        ],
        isMock: true,
        message: 'Using sample trip plan. Configure OpenAI API key for AI-generated personalized itineraries.',
        rawWeatherData: weather,
        rawFlightData: flights,
        rawHotelData: hotels
    };
}
