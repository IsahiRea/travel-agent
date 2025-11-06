import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useProgressiveTripData } from '../hooks/useProgressiveTripData';
import { useActiveSection } from '../hooks/useActiveSection';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import LoadingProgress from '../components/LoadingProgress';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import Icon from '../components/Icon';
import ResultsSidebar from '../components/results/ResultsSidebar';
import TripHeader from '../components/results/TripHeader';
import TripInfoCards from '../components/results/TripInfoCards';
import WeatherCard from '../components/results/WeatherCard';
import FlightCard from '../components/results/FlightCard';
import HotelCard from '../components/results/HotelCard';
import BudgetBreakdown from '../components/results/BudgetBreakdown';
import DailyItinerary from '../components/results/DailyItinerary';
import TravelTips from '../components/results/TravelTips';
import PackingList from '../components/results/PackingList';
import TripSummary from '../components/results/TripSummary';
import './Results.css';


export default function Results() {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState(null);

  // Custom hooks for navigation
  const activeSection = useActiveSection();
  useSmoothScroll();

  // Load form data from sessionStorage
  useEffect(() => {
    try {
      const storedFormData = sessionStorage.getItem('tripFormData');
      if (storedFormData) {
        setTripData(JSON.parse(storedFormData));
      } else {
        // If no form data, redirect to planning page
        console.warn('No trip form data found, redirecting to planning page');
        navigate('/planning');
      }
    } catch (error) {
      console.error('Failed to read from sessionStorage:', error);
      navigate('/planning');
    }
  }, [navigate]);

  // Use progressive loading hook with streaming support
  const { stage, data, error, retry, streamingProgress } = useProgressiveTripData(tripData);

  // Show error state
  if (error) {
    return (
      <div className="results-page">
        <ErrorDisplay message={error} onRetry={retry} />
      </div>
    );
  }

  // Show loading progress
  if (!tripData) {
    return (
      <div className="results-page">
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Extract data from progressive loading
  const weatherData = data.weather;
  const flightData = data.flights;
  const hotelData = data.hotels;
  const tripPlan = data.plan;

  // Use partial streaming data if available and full plan not yet loaded
  const streamingPartialPlan = streamingProgress?.partialData;
  const displayPlan = tripPlan || streamingPartialPlan;

  return (
    <div className="results-page">
      <div className="results-nav">
        <button className="nav-button" onClick={() => navigate('/planning')}>
          <Icon name="back" className="nav-icon" size={16} color="#2d2d2d" alt="Back arrow" />
          <span className="nav-text">Back to Planning</span>
        </button>
        <button className="nav-button secondary" onClick={() => navigate('/planning')}>
          <Icon name="plan" className="nav-icon" size={16} color="#2d2d2d" alt="Plan document" />
          <span className="nav-text">Plan Another Trip</span>
        </button>
      </div>

      {/* Show loading progress while data is being fetched */}
      {stage !== 'complete' && (
        <LoadingProgress currentStage={stage} streamingProgress={streamingProgress} />
      )}

      <div className="trip-details">
        {/* Sidebar - Only visible on desktop (1280px+) */}
        <ResultsSidebar
          tripData={tripData}
          displayPlan={displayPlan}
          activeSection={activeSection}
        />

        {/* Main Content */}
        <main className="trip-main-content">
          {/* Header & Info Cards - Hidden on desktop, shown on mobile/tablet */}
          <div id="overview" className="mobile-header-section">
            {displayPlan && (
              <>
                <TripHeader
                  destination={displayPlan.destination}
                  tripData={tripData}
                  isStreaming={!!streamingPartialPlan && !tripPlan}
                />
                <TripInfoCards tripData={tripData} />
              </>
            )}
          </div>

          {/* Weather Section - Show skeleton while loading */}
          <div className="full-width-section">
            {!weatherData && stage !== 'complete' && stage !== 'initializing' && (
              <LoadingSkeleton type="weather" />
            )}
            {displayPlan?.rawWeatherData && (
              <WeatherCard weatherData={displayPlan.rawWeatherData} />
            )}
          </div>

          {/* Flight & Hotel Cards Grid - 2 columns on desktop */}
          <div className="cards-grid">
            {/* Flight Section - Show skeleton while loading */}
            <div id="flights">
              {!flightData && (stage === 'flights' || (stage !== 'complete' && stage !== 'initializing' && stage !== 'weather')) && (
                <LoadingSkeleton type="flight" />
              )}
              {displayPlan?.selectedFlight && (
                <FlightCard
                  flight={displayPlan.selectedFlight}
                  tripData={tripData}
                  isStreaming={!!streamingPartialPlan && !tripPlan}
                />
              )}
            </div>

            {/* Hotel Section - Show skeleton while loading */}
            <div id="hotels">
              {!hotelData && (stage === 'hotels' || (stage !== 'complete' && stage !== 'initializing' && stage !== 'weather' && stage !== 'flights')) && (
                <LoadingSkeleton type="hotel" />
              )}
              {displayPlan?.selectedHotel && (
                <HotelCard
                  hotel={displayPlan.selectedHotel}
                  tripData={tripData}
                  isStreaming={!!streamingPartialPlan && !tripPlan}
                />
              )}
            </div>
          </div>

          {/* Itinerary Section - Show skeleton while loading if no partial data */}
          {!displayPlan && stage === 'ai' && (
            <LoadingSkeleton type="itinerary" />
          )}

          {/* Show streaming indicator for itinerary if generating */}
          {streamingPartialPlan && !tripPlan && streamingPartialPlan.dailyItineraryCount > 0 && (
            <div className="streaming-message">
              <div className="streaming-dot-pulse"></div>
              Generating daily itinerary... ({streamingPartialPlan.dailyItineraryCount} days in progress)
            </div>
          )}

          {/* Budget Breakdown - Full Width */}
          <div id="budget" className="full-width-section">
            {displayPlan?.budgetAnalysis && (
              <BudgetBreakdown budgetAnalysis={displayPlan.budgetAnalysis} />
            )}
          </div>

          {/* Daily Itinerary - Full Width */}
          <div id="itinerary" className="full-width-section">
            {displayPlan?.dailyItinerary && displayPlan.dailyItinerary.length > 0 && (
              <DailyItinerary itinerary={displayPlan.dailyItinerary} />
            )}
          </div>

          {/* Travel Tips & Packing List - Full Width */}
          <div id="tips" className="full-width-section">
            <div className="tips-packing-grid">
              {displayPlan?.travelTips && displayPlan.travelTips.length > 0 && (
                <TravelTips tips={displayPlan.travelTips} />
              )}

              {displayPlan?.packingRecommendations && displayPlan.packingRecommendations.length > 0 && (
                <PackingList items={displayPlan.packingRecommendations} />
              )}
            </div>
          </div>

          {/* Trip Summary - Full Width */}
          <div className="full-width-section">
            {displayPlan?.summary && (
              <TripSummary summary={displayPlan.summary} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
