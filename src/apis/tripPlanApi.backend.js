/**
 * Trip Plan API Module (Backend Version)
 * Calls serverless functions instead of external APIs directly
 * This version secures API keys by moving them to the backend
 */

/**
 * Generate a trip plan using backend serverless function
 * @param {Object} data - Collected trip data
 * @param {Object} data.weather - Weather data
 * @param {Object} data.flights - Flight data
 * @param {Object} data.hotels - Hotel data
 * @param {Object} data.tripData - Original trip form data
 * @returns {Promise<Object>} Generated trip plan
 */
export async function generateTripPlan(data) {
    try {
        console.log('Generating trip plan with backend API...');

        const { weather, flights, hotels, tripData } = data;

        const response = await fetch('/api/trip-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                origin: tripData.departFrom,
                destination: tripData.arriveAt,
                startDate: tripData.departDate,
                endDate: tripData.returnDate,
                budget: tripData.budget,
                travelers: tripData.travelers,
                weatherData: weather,
                flightData: flights,
                hotelData: hotels
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Backend API error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to generate trip plan');
        }

        // Parse the trip plan (it comes as a text string from OpenAI)
        const tripPlan = parseTripPlan(result.data.plan, data);

        return {
            success: true,
            ...tripPlan,
            rawWeatherData: weather,
            rawFlightData: flights,
            rawHotelData: hotels
        };

    } catch (error) {
        console.error('Error generating trip plan:', error);

        // Fallback to a basic trip plan structure
        return getMockTripPlan(data);
    }
}

/**
 * Parse the AI-generated trip plan text into structured format
 * @param {string} planText - Trip plan text from OpenAI
 * @param {Object} data - Original data
 * @returns {Object} Structured trip plan
 */
function parseTripPlan(planText, data) {
    const { tripData, flights, hotels, weather } = data;
    const { arriveAt, departDate, returnDate, budget, travelers } = tripData;

    const startDate = new Date(departDate);
    const endDate = new Date(returnDate);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Select first available flight and hotel
    const selectedFlight = flights?.flights?.[0] || null;
    const selectedHotel = hotels?.hotels?.[0] || null;

    const flightCost = selectedFlight ? parseFloat(selectedFlight.price.total) : 0;
    const hotelCost = selectedHotel ? parseFloat(selectedHotel.price.total) : 0;

    // Generate daily itinerary based on weather
    const dailyItinerary = generateDailyItinerary(days, startDate, weather, arriveAt);

    const totalActivityCost = dailyItinerary.reduce((sum, day) =>
        sum + day.activities.reduce((aSum, a) => aSum + a.estimatedCost, 0), 0
    );

    const totalMealCost = dailyItinerary.reduce((sum, day) =>
        sum + day.meals.reduce((mSum, m) => mSum + m.estimatedCost, 0), 0
    );

    const transportationCost = days * 20;
    const miscCost = Math.round(budget * 0.1);

    return {
        summary: planText.substring(0, 300) + '...', // Use first part of AI text as summary
        fullPlan: planText,
        destination: arriveAt,
        tripDuration: days,
        selectedFlight: selectedFlight ? {
            outboundDetails: `${selectedFlight.outbound.departure.airport} to ${selectedFlight.outbound.arrival.airport} via ${selectedFlight.airline}`,
            returnDetails: selectedFlight.return
                ? `${selectedFlight.return.departure.airport} to ${selectedFlight.return.arrival.airport} via ${selectedFlight.airline}`
                : 'One-way flight',
            totalCost: flightCost,
            airline: selectedFlight.airline,
            flightId: selectedFlight.id,
            originCode: selectedFlight.outbound.departure.airport,
            destinationCode: selectedFlight.outbound.arrival.airport,
            departureTime: selectedFlight.outbound.departure.time,
            arrivalTime: selectedFlight.outbound.arrival.time,
            stops: selectedFlight.outbound.stops,
            returnOriginCode: selectedFlight.return?.departure?.airport,
            returnDestinationCode: selectedFlight.return?.arrival?.airport,
            returnDepartureTime: selectedFlight.return?.departure?.time,
            returnArrivalTime: selectedFlight.return?.arrival?.time
        } : null,
        selectedHotel: selectedHotel ? {
            name: selectedHotel.name,
            rating: selectedHotel.rating,
            location: selectedHotel.location.address?.cityName || arriveAt,
            totalCost: hotelCost,
            amenities: selectedHotel.amenities || []
        } : null,
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
        travelTips: extractTravelTips(planText),
        packingRecommendations: extractPackingRecommendations(planText, weather)
    };
}

/**
 * Generate daily itinerary
 */
function generateDailyItinerary(days, startDate, weather, destination) {
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
                    name: i === 0 ? 'Hotel Check-in & City Orientation' : 'Local Exploration',
                    description: i === 0
                        ? 'Arrive at hotel, settle in, and take a walking tour'
                        : 'Explore local markets and neighborhoods',
                    estimatedCost: i === 0 ? 0 : 20,
                    weatherDependent: false
                },
                {
                    time: 'Afternoon',
                    name: dayWeather.precipitation ? 'Indoor Activities' : 'City Sightseeing',
                    description: dayWeather.precipitation
                        ? 'Visit museums and cultural sites'
                        : 'Explore landmarks and attractions',
                    estimatedCost: 30,
                    weatherDependent: !dayWeather.precipitation
                },
                {
                    time: 'Evening',
                    name: 'Dinner & Entertainment',
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
                    suggestion: 'Recommended restaurant',
                    cuisine: 'Local/International',
                    estimatedCost: 50
                }
            ]
        });
    }

    return dailyItinerary;
}

/**
 * Extract travel tips from AI text
 */
function extractTravelTips(planText) {
    // Simple extraction - look for bullet points or numbered lists
    // This is a fallback; ideally the AI response would be structured
    return [
        'Book activities in advance during peak season',
        'Learn a few basic phrases in the local language',
        'Keep copies of important documents',
        'Purchase travel insurance before departure',
        'Stay hydrated and protect yourself from the sun'
    ];
}

/**
 * Extract packing recommendations
 */
function extractPackingRecommendations(planText, weather) {
    const hasRain = weather?.forecast?.some(d => d.precipitation);

    return [
        'Comfortable walking shoes',
        hasRain ? 'Umbrella and rain jacket' : 'Sunscreen and sunglasses',
        'Light layers for changing weather',
        'Universal power adapter',
        'Portable charger for electronics'
    ];
}

/**
 * Fallback mock trip plan
 */
function getMockTripPlan(data) {
    const { tripData, weather, flights, hotels } = data;
    const { arriveAt, departDate, returnDate, budget, travelers } = tripData;

    const startDate = new Date(departDate);
    const endDate = new Date(returnDate);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const selectedFlight = flights?.flights?.[0];
    const selectedHotel = hotels?.hotels?.[0];

    const flightCost = selectedFlight ? parseFloat(selectedFlight.price.total) : 650;
    const hotelCost = selectedHotel ? parseFloat(selectedHotel.price.total) : 450;

    const dailyItinerary = generateDailyItinerary(days, startDate, weather, arriveAt);

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
        summary: `A ${days}-day adventure in ${arriveAt} for ${travelers} traveler${travelers > 1 ? 's' : ''}.`,
        fullPlan: 'Using sample trip plan. The backend API is configured but OpenAI may not be responding.',
        destination: arriveAt,
        tripDuration: days,
        selectedFlight: selectedFlight ? {
            outboundDetails: `${selectedFlight.outbound.departure.airport} to ${selectedFlight.outbound.arrival.airport}`,
            returnDetails: selectedFlight.return ? `${selectedFlight.return.departure.airport} to ${selectedFlight.return.arrival.airport}` : 'One-way',
            totalCost: flightCost,
            airline: selectedFlight.airline
        } : null,
        selectedHotel: selectedHotel ? {
            name: selectedHotel.name,
            rating: selectedHotel.rating,
            location: arriveAt,
            totalCost: hotelCost,
            amenities: selectedHotel.amenities || []
        } : null,
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
        travelTips: extractTravelTips(''),
        packingRecommendations: extractPackingRecommendations('', weather),
        isMock: true,
        message: 'Using sample trip plan.',
        rawWeatherData: weather,
        rawFlightData: flights,
        rawHotelData: hotels
    };
}
