import { useState, useEffect, useCallback } from 'react';
import { fetchWeatherData, fetchFlightData, fetchHotelData, generateTripPlan } from '../api';
import { generateTripPlanStreaming } from '../apis/streamingTripPlanApi.backend';

const SECTION_IDLE = 'idle';
const SECTION_LOADING = 'loading';
const SECTION_SUCCESS = 'success';
const SECTION_ERROR = 'error';

function createSection(status = SECTION_IDLE, data = null, error = null) {
    return { status, data, error };
}

/**
 * Custom hook for progressive trip data loading with graceful degradation.
 * Fetches weather, flights, and hotels in parallel. Each section tracks its own
 * status independently — a failed section does not block the others.
 * The AI stage adapts its prompt based on which data is available.
 *
 * @param {Object} tripData - Form data from Planning page
 * @returns {Object} { stage, sections, data, error, isLoading, retry, retrySection, streamingProgress }
 */
export function useProgressiveTripData(tripData) {
    const [stage, setStage] = useState('initializing');
    const [sections, setSections] = useState({
        weather: createSection(),
        flights: createSection(),
        hotels: createSection(),
        plan: createSection()
    });
    const [isLoading, setIsLoading] = useState(true);
    const [streamingProgress, setStreamingProgress] = useState(null);

    // Convenience accessors matching old API shape
    const data = {
        weather: sections.weather.data,
        flights: sections.flights.data,
        hotels: sections.hotels.data,
        plan: sections.plan.data
    };

    // Global error only when ALL data sections fail (nothing for AI to work with)
    const allDataFailed = sections.weather.status === SECTION_ERROR
        && sections.flights.status === SECTION_ERROR
        && sections.hotels.status === SECTION_ERROR;
    const error = allDataFailed
        ? 'All data sources failed. Please check your connection and try again.'
        : sections.plan.status === SECTION_ERROR
            ? sections.plan.error
            : null;

    const updateSection = (name, updates) => {
        setSections(prev => ({ ...prev, [name]: { ...prev[name], ...updates } }));
    };

    // Fetch a single data section with error isolation
    const fetchSection = async (name, fetcher) => {
        updateSection(name, { status: SECTION_LOADING, error: null });
        try {
            const result = await fetcher();
            if (!result || result.error) {
                throw new Error(result?.error || `Failed to fetch ${name} data`);
            }
            updateSection(name, { status: SECTION_SUCCESS, data: result });
            return result;
        } catch (err) {
            console.error(`${name} fetch failed:`, err);
            updateSection(name, { status: SECTION_ERROR, error: err.message });
            return null;
        }
    };

    // Generate AI plan with whatever data is available
    const generatePlan = async (weather, flights, hotels) => {
        updateSection('plan', { status: SECTION_LOADING, error: null });
        setStreamingProgress(null);

        const handleStreamUpdate = (partialPlan) => {
            setStreamingProgress(partialPlan);
        };

        let plan;
        try {
            plan = await generateTripPlanStreaming({
                weather, flights, hotels, tripData
            }, handleStreamUpdate);
        } catch (streamError) {
            console.warn('Streaming failed, falling back to non-streaming:', streamError);
            try {
                plan = await generateTripPlan({
                    weather, flights, hotels, tripData
                });
            } catch (fallbackError) {
                console.error('Both streaming and non-streaming failed:', fallbackError);
                updateSection('plan', {
                    status: SECTION_ERROR,
                    error: fallbackError.message || 'Failed to generate trip plan'
                });
                return null;
            }
        }

        if (!plan || plan.error) {
            updateSection('plan', {
                status: SECTION_ERROR,
                error: plan?.error || 'Failed to generate trip plan'
            });
            return null;
        }

        updateSection('plan', { status: SECTION_SUCCESS, data: plan });
        setStreamingProgress(null);
        return plan;
    };

    const loadData = useCallback(async () => {
        if (!tripData) return;

        setIsLoading(true);
        setSections({
            weather: createSection(),
            flights: createSection(),
            hotels: createSection(),
            plan: createSection()
        });

        // Stage 1: Fetch weather, flights, and hotels in parallel
        setStage('fetching');
        const [weather, flights, hotels] = await Promise.all([
            fetchSection('weather', () => fetchWeatherData(tripData)),
            fetchSection('flights', () => fetchFlightData(tripData)),
            fetchSection('hotels', () => fetchHotelData(tripData))
        ]);

        // If everything failed, no point calling AI
        if (!weather && !flights && !hotels) {
            setIsLoading(false);
            return;
        }

        // Stage 2: AI generation with whatever data we have
        setStage('ai');
        const plan = await generatePlan(weather, flights, hotels);

        if (plan) {
            // Save complete data to sessionStorage
            sessionStorage.setItem('tripPlan', JSON.stringify({
                weather, flights, hotels, plan, tripData
            }));
        }

        setStage('complete');
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripData]);

    useEffect(() => {
        if (tripData) {
            loadData();
        }
    }, [tripData, loadData]);

    // Retry everything from scratch
    const retry = () => {
        loadData();
    };

    // Retry a single failed section
    const retrySection = async (sectionName) => {
        if (sectionName === 'weather') {
            const result = await fetchSection('weather', () => fetchWeatherData(tripData));
            // Re-generate plan if we now have new data
            if (result && sections.plan.status !== SECTION_LOADING) {
                setStage('ai');
                await generatePlan(
                    result,
                    sections.flights.data,
                    sections.hotels.data
                );
                setStage('complete');
            }
        } else if (sectionName === 'flights') {
            const result = await fetchSection('flights', () => fetchFlightData(tripData));
            if (result && sections.plan.status !== SECTION_LOADING) {
                setStage('ai');
                await generatePlan(
                    sections.weather.data,
                    result,
                    sections.hotels.data
                );
                setStage('complete');
            }
        } else if (sectionName === 'hotels') {
            const result = await fetchSection('hotels', () => fetchHotelData(tripData));
            if (result && sections.plan.status !== SECTION_LOADING) {
                setStage('ai');
                await generatePlan(
                    sections.weather.data,
                    sections.flights.data,
                    result
                );
                setStage('complete');
            }
        } else if (sectionName === 'plan') {
            setStage('ai');
            await generatePlan(
                sections.weather.data,
                sections.flights.data,
                sections.hotels.data
            );
            setStage('complete');
        }
    };

    return {
        stage,
        sections,
        data,
        error,
        isLoading,
        retry,
        retrySection,
        streamingProgress
    };
}
