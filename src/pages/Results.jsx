import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useProgressiveTripData } from '../hooks/useProgressiveTripData';
import { useActiveSection } from '../hooks/useActiveSection';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import { searchDestinationPhotos, triggerUnsplashDownload } from '../api';
import LoadingProgress from '../components/LoadingProgress';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import SectionError from '../components/SectionError';
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
import { ROUTES } from '../constants/routes';
import '../styles/pages/Results.css';


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
        navigate(ROUTES.PLANNING);
      }
    } catch (error) {
      console.error('Failed to read from sessionStorage:', error);
      navigate(ROUTES.PLANNING);
    }
  }, [navigate]);

  // Fetch destination image from Unsplash
  const [destinationImage, setDestinationImage] = useState(null);
  useEffect(() => {
    if (!tripData?.arriveAt) return;

    let cancelled = false;
    async function fetchImage() {
      try {
        const photos = await searchDestinationPhotos(`${tripData.arriveAt} travel landmark`, 1);
        if (!cancelled && photos?.length > 0) {
          setDestinationImage(photos[0]);
          triggerUnsplashDownload(photos[0].downloadUrl);
        }
      } catch (err) {
        console.error('Error loading destination image:', err);
      }
    }
    fetchImage();
    return () => { cancelled = true; };
  }, [tripData?.arriveAt]);

  // Fetch flight and hotel images once the AI plan is available
  const [flightImage, setFlightImage] = useState(null);
  const [hotelImage, setHotelImage] = useState(null);

  // Use progressive loading hook with streaming support
  const { stage, sections, data, error, retry, retrySection, streamingProgress } = useProgressiveTripData(tripData);

  // Fetch flight/hotel images when the plan resolves
  const plan = data.plan;
  useEffect(() => {
    if (!plan) return;
    let cancelled = false;

    async function fetchCardImages() {
      const destination = plan.destination || tripData?.arriveAt;
      const promises = [];

      if (plan.selectedFlight?.airline) {
        promises.push(
          searchDestinationPhotos(`${plan.selectedFlight.airline} airplane`, 1)
            .then(photos => {
              if (!cancelled && photos?.length > 0) {
                setFlightImage(photos[0]);
                triggerUnsplashDownload(photos[0].downloadUrl);
              }
            })
            .catch(() => {})
        );
      }

      if (plan.selectedHotel?.name) {
        promises.push(
          searchDestinationPhotos(`${plan.selectedHotel.name} hotel ${destination}`, 1)
            .then(photos => {
              if (!cancelled && photos?.length > 0) {
                setHotelImage(photos[0]);
                triggerUnsplashDownload(photos[0].downloadUrl);
              }
            })
            .catch(() => {})
        );
      }

      await Promise.all(promises);
    }

    fetchCardImages();
    return () => { cancelled = true; };
  }, [plan, tripData?.arriveAt]);

  // Show full-page error only when all data sources fail
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

  // Use partial streaming data if available and full plan not yet loaded
  const streamingPartialPlan = streamingProgress?.partialData;
  const displayPlan = plan || streamingPartialPlan;

  const isAI = stage === 'ai';

  return (
    <div className="results-page">
      <div className="results-nav">
        <button className="nav-button" onClick={() => navigate(ROUTES.PLANNING)}>
          <Icon name="back" className="nav-icon" size={16} color="#2d2d2d" alt="Back arrow" />
          <span className="nav-text">Back to Planning</span>
        </button>
        <button className="nav-button secondary" onClick={() => navigate(ROUTES.PLANNING)}>
          <Icon name="plan" className="nav-icon" size={16} color="#2d2d2d" alt="Plan document" />
          <span className="nav-text">Plan Another Trip</span>
        </button>
      </div>

      {/* Show loading progress while data is being fetched */}
      {stage !== 'complete' && (
        <LoadingProgress currentStage={stage} sections={sections} streamingProgress={streamingProgress} />
      )}

      <div className="trip-details">
        {/* Sidebar - Only visible on desktop (1280px+) */}
        <ResultsSidebar
          tripData={tripData}
          displayPlan={displayPlan}
          activeSection={activeSection}
          destinationImage={destinationImage}
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
                  isStreaming={!!streamingPartialPlan && !plan}
                  destinationImage={destinationImage}
                />
                <TripInfoCards tripData={tripData} />
              </>
            )}
          </div>

          {/* Weather Section */}
          <div className="full-width-section">
            {sections.weather.status === 'loading' && (
              <LoadingSkeleton type="weather" />
            )}
            {sections.weather.status === 'error' && (
              <SectionError
                section="weather"
                message={sections.weather.error}
                onRetry={() => retrySection('weather')}
              />
            )}
            {displayPlan?.rawWeatherData && (
              <WeatherCard weatherData={displayPlan.rawWeatherData} />
            )}
          </div>

          {/* Flight & Hotel Cards Grid - 2 columns on desktop */}
          <div className="cards-grid">
            {/* Flight Section */}
            <div id="flights">
              {sections.flights.status === 'loading' && (
                <LoadingSkeleton type="flight" />
              )}
              {sections.flights.status === 'error' && (
                <SectionError
                  section="flights"
                  message={sections.flights.error}
                  onRetry={() => retrySection('flights')}
                />
              )}
              {displayPlan?.selectedFlight && (
                <FlightCard
                  flight={displayPlan.selectedFlight}
                  tripData={tripData}
                  isStreaming={!!streamingPartialPlan && !plan}
                  cardImage={flightImage}
                />
              )}
            </div>

            {/* Hotel Section */}
            <div id="hotels">
              {sections.hotels.status === 'loading' && (
                <LoadingSkeleton type="hotel" />
              )}
              {sections.hotels.status === 'error' && (
                <SectionError
                  section="hotels"
                  message={sections.hotels.error}
                  onRetry={() => retrySection('hotels')}
                />
              )}
              {displayPlan?.selectedHotel && (
                <HotelCard
                  hotel={displayPlan.selectedHotel}
                  tripData={tripData}
                  isStreaming={!!streamingPartialPlan && !plan}
                  cardImage={hotelImage}
                />
              )}
            </div>
          </div>

          {/* Itinerary Section - Show skeleton while loading if no partial data */}
          {!displayPlan && isAI && (
            <LoadingSkeleton type="itinerary" />
          )}

          {/* Show streaming indicator for itinerary if generating */}
          {streamingPartialPlan && !plan && streamingPartialPlan.dailyItineraryCount > 0 && (
            <div className="streaming-message">
              <div className="streaming-dot-pulse"></div>
              Generating daily itinerary... ({streamingPartialPlan.dailyItineraryCount} days in progress)
            </div>
          )}

          {/* AI Plan Error */}
          {sections.plan.status === 'error' && (
            <div className="full-width-section">
              <SectionError
                section="plan"
                message={sections.plan.error}
                onRetry={() => retrySection('plan')}
              />
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
