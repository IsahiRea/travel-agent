import { useState, useEffect } from 'react';
import { fetchWeatherData, fetchFlightData, fetchHotelData, generateTripPlan } from '../api';
import { generateTripPlanStreaming } from '../apis/streamingTripPlanApi';

/**
 * Custom hook for progressive trip data loading with streaming AI generation
 * Loads data in stages: weather → flights → hotels → AI generation (streaming)
 * Updates state after each stage completes, with partial updates during AI streaming
 *
 * @param {Object} tripData - Form data from Planning page
 * @returns {Object} { stage, data, error, isLoading, retry }
 */
export function useProgressiveTripData(tripData) {
    const [stage, setStage] = useState('initializing'); // initializing | weather | flights | hotels | ai | complete
    const [data, setData] = useState({
        weather: null,
        flights: null,
        hotels: null,
        plan: null
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [streamingProgress, setStreamingProgress] = useState(null); // For partial AI updates

    const loadData = async () => {
        // Don't set error if tripData is null - it might be loading
        if (!tripData) {
            return;
        }

        try {
            setError(null);
            setIsLoading(true);

            // Stage 1: Weather
            setStage('weather');
            const weather = await fetchWeatherData(tripData);
            if (!weather || weather.error) {
                throw new Error(weather?.error || 'Failed to fetch weather data');
            }
            setData(prev => ({ ...prev, weather }));

            // Stage 2: Flights
            setStage('flights');
            const flights = await fetchFlightData(tripData);
            if (!flights || flights.error) {
                throw new Error(flights?.error || 'Failed to fetch flight data');
            }
            setData(prev => ({ ...prev, flights }));

            // Stage 3: Hotels
            setStage('hotels');
            const hotels = await fetchHotelData(tripData);
            if (!hotels || hotels.error) {
                throw new Error(hotels?.error || 'Failed to fetch hotel data');
            }
            setData(prev => ({ ...prev, hotels }));

            // Stage 4: AI Generation with Streaming
            setStage('ai');

            // Callback for streaming partial updates
            const handleStreamUpdate = (partialPlan) => {
                setStreamingProgress(partialPlan);
            };

            // Try streaming first, fallback to non-streaming
            let plan;
            try {
                plan = await generateTripPlanStreaming({
                    weather,
                    flights,
                    hotels,
                    tripData
                }, handleStreamUpdate);
            } catch (streamError) {
                console.warn('Streaming failed, falling back to non-streaming:', streamError);
                // Fallback to non-streaming generation
                plan = await generateTripPlan({
                    weather,
                    flights,
                    hotels,
                    tripData
                });
            }

            if (!plan || plan.error) {
                throw new Error(plan?.error || 'Failed to generate trip plan');
            }
            setData(prev => ({ ...prev, plan }));
            setStreamingProgress(null); // Clear streaming progress

            // Save complete data to sessionStorage
            sessionStorage.setItem('tripPlan', JSON.stringify({
                weather,
                flights,
                hotels,
                plan,
                tripData
            }));

            setStage('complete');
            setIsLoading(false);
        } catch (err) {
            console.error('Progressive loading error:', err);
            setError(err.message || 'An unexpected error occurred');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (tripData) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripData]); // Run when tripData changes

    const retry = () => {
        setData({
            weather: null,
            flights: null,
            hotels: null,
            plan: null
        });
        loadData();
    };

    return { stage, data, error, isLoading, retry, streamingProgress };
}
