import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useProgressiveTripData } from '../hooks/useProgressiveTripData';
import LoadingProgress from '../components/LoadingProgress';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import Icon from '../components/Icon';
import { generateFlightBookingLink, generateHotelBookingLink, trackBookingClick } from '../utils/bookingLinks';
import './Results.css';
import imgHeroEiffel from '../assets/images/photos/hero-eiffel.jpg';
import imgFlightWing from '../assets/images/photos/flight-wing.jpg';
import imgHotelRoom from '../assets/images/photos/hotel-room.jpg';

//TODO: Refactor page into smaller components for readability
//TODO: Add different hero images based on destination (use unsplash API?)
//TODO: Update Desktop Design for better use of space (maybe 2-column layout with image sidebar?)



/**
 * Format date string to user-friendly format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "Nov 23")
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Format flight duration from ISO 8601 format
 * @param {string} duration - Duration in ISO format (e.g., "PT8H30M")
 * @returns {string} Formatted duration (e.g., "8h 30m")
 */
 
function _formatDuration(duration) {
  if (!duration) return '';
  const match = duration.match(/PT(\d+H)?(\d+M)?/);
  if (!match) return duration;

  const hours = match[1] ? match[1].replace('H', 'h') : '';
  const minutes = match[2] ? ' ' + match[2].replace('M', 'm') : '';
  return hours + minutes;
}

/**
 * Format time from ISO string
 * @param {string} timeStr - ISO time string
 * @returns {string} Formatted time (e.g., "10:30 AM")
 */
 
function _formatTime(timeStr) {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function Results() {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState(null);

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

  // Handler for flight booking button click
  const handleFlightBookingClick = () => {
    if (!displayPlan?.selectedFlight || !tripData) return;

    // Track the click
    trackBookingClick('flight', displayPlan.selectedFlight);

    // Generate and open booking link
    const bookingUrl = generateFlightBookingLink(displayPlan.selectedFlight, tripData);
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  };

  // Handler for hotel booking button click
  const handleHotelBookingClick = () => {
    if (!displayPlan?.selectedHotel || !tripData) return;

    // Track the click
    trackBookingClick('hotel', displayPlan.selectedHotel);

    // Generate and open booking link
    const bookingUrl = generateHotelBookingLink(displayPlan.selectedHotel, tripData);
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  };

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
        {displayPlan && (
          <>
            <div className="hero-banner">
              <img alt={displayPlan.destination || 'Your destination'} className="hero-image" src={imgHeroEiffel} />
              <div className="hero-overlay" />
              <div className="hero-content">
                <div className="itinerary-badge">
                  <Icon name="itinerary" className="badge-icon" size={16} color="white" alt="Itinerary document" />
                  <span className="results-badge-text">Your Itinerary</span>
                  {streamingPartialPlan && !tripPlan && (
                    <span className="streaming-badge">Generating...</span>
                  )}
                </div>
                <div className="hero-info">
                  <h1 className="trip-title">Trip to {displayPlan.destination || tripData.arriveAt}</h1>
                  <div className="trip-meta">
                    <div className="meta-card">
                      <Icon name="calendar" className="meta-icon" size={20} color="white" alt="Calendar" />
                      <div className="meta-content">
                        <span className="meta-text">{formatDate(tripData.departDate)}</span>
                        <Icon name="arrowRight" className="arrow-icon" size={16} color="white" alt="to" />
                        <span className="meta-text">{formatDate(tripData.returnDate)}</span>
                      </div>
                    </div>
                    <div className="meta-card">
                      <Icon name="location" className="meta-icon" size={20} color="white" alt="Location" />
                      <div className="meta-content">
                        <span className="meta-text">{tripData.departFrom}</span>
                        <Icon name="arrowRight" className="arrow-icon" size={16} color="white" alt="to" />
                        <span className="meta-text">{tripData.arriveAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon">
                  <Icon name="travelers" size={24} color="#6b5d53" alt="Travelers" />
                </div>
                <div className="info-content">
                  <span className="info-label">Travelers</span>
                  <span className="info-value">
                    {tripData.travelers} {tripData.travelers === 1 ? 'Person' : 'People'}
                  </span>
                </div>
              </div>
              <div className="info-card">
                <div className="info-icon">
                  <Icon name="budget" size={20} color="#6b5d53" alt="Budget" />
                </div>
                <div className="info-content">
                  <span className="info-label">Total Budget</span>
                  <span className="info-value">${tripData.budget.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Weather Section - Show skeleton while loading */}
        {!weatherData && stage !== 'complete' && stage !== 'initializing' && (
          <LoadingSkeleton type="weather" />
        )}
        {displayPlan?.rawWeatherData && displayPlan.rawWeatherData.forecast && displayPlan.rawWeatherData.forecast.length > 0 && (
          <div className="weather-card">
            <div className="weather-icon">
              <Icon name="weather" size={24} color="#6b5d53" alt="Weather" />
            </div>
            <div className="weather-content">
              <h3 className="card-title">Weather Forecast</h3>
              <p className="card-description">
                {displayPlan.rawWeatherData.summary || 'Weather information for your destination.'}
              </p>
              <div className="temp-boxes">
                <div className="temp-box">
                  <span className="temp-label">Low</span>
                  <span className="temp-value">
                    {Math.min(...displayPlan.rawWeatherData.forecast.map(d => d.tempMin))}°C
                  </span>
                </div>
                <div className="temp-box">
                  <span className="temp-label">High</span>
                  <span className="temp-value">
                    {Math.max(...displayPlan.rawWeatherData.forecast.map(d => d.tempMax))}°C
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flight Section - Show skeleton while loading */}
        {!flightData && (stage === 'flights' || (stage !== 'complete' && stage !== 'initializing' && stage !== 'weather')) && (
          <LoadingSkeleton type="flight" />
        )}
        {displayPlan?.selectedFlight && (
          <div className="recommendation-card">
            <div className="rec-image-container">
              <img alt="Flight" className="rec-image" src={imgFlightWing} />
              <div className="rec-overlay" />
              <div className="rec-badge best-deal">Best Value</div>
              {streamingPartialPlan && !tripPlan && (
                <div className="streaming-overlay">Generating...</div>
              )}
            </div>
            <div className="rec-content">
              <div className="rec-icon">
                <Icon name="plane" size={24} color="#6b5d53" alt="Flight" />
              </div>
              <div className="rec-details">
                <h3 className="card-title">Recommended Flight</h3>
                <p className="card-description">
                  {displayPlan.selectedFlight.outboundDetails}
                  {displayPlan.selectedFlight.returnDetails && ` • ${displayPlan.selectedFlight.returnDetails}`}
                </p>
                <div className="tag-group">
                  <span className="tag">{displayPlan.selectedFlight.airline}</span>
                  <span className="tag">${displayPlan.selectedFlight.totalCost.toFixed(2)}</span>
                  <span className="tag">{tripData.travelers} {tripData.travelers === 1 ? 'Traveler' : 'Travelers'}</span>
                </div>
              </div>
            </div>
            <button
              className="book-button"
              onClick={handleFlightBookingClick}
              aria-label={`Search for ${displayPlan.selectedFlight.airline} flights`}
            >
              View Details
            </button>
          </div>
        )}

        {/* Hotel Section - Show skeleton while loading */}
        {!hotelData && (stage === 'hotels' || (stage !== 'complete' && stage !== 'initializing' && stage !== 'weather' && stage !== 'flights')) && (
          <LoadingSkeleton type="hotel" />
        )}
        {displayPlan?.selectedHotel && (
          <div className="recommendation-card">
            <div className="rec-image-container">
              <img alt="Hotel" className="rec-image" src={imgHotelRoom} />
              <div className="rec-overlay" />
              <div className="rec-badge rating">{displayPlan.selectedHotel.rating}★ Rating</div>
              {streamingPartialPlan && !tripPlan && (
                <div className="streaming-overlay">Generating...</div>
              )}
            </div>
            <div className="rec-content">
              <div className="rec-icon">
                <Icon name="hotel" size={24} color="#6b5d53" alt="Hotel" />
              </div>
              <div className="rec-details">
                <h3 className="card-title">{displayPlan.selectedHotel.name}</h3>
                <p className="card-description">
                  Located in {displayPlan.selectedHotel.location}. Total cost: ${displayPlan.selectedHotel.totalCost.toFixed(2)} for your stay.
                </p>
                <div className="tag-group">
                  {displayPlan.selectedHotel.amenities && displayPlan.selectedHotel.amenities.slice(0, 3).map((amenity, idx) => (
                    <span key={idx} className="tag">{amenity.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            </div>
            <button
              className="book-button"
              onClick={handleHotelBookingClick}
              aria-label={`Search for ${displayPlan.selectedHotel.name} hotel`}
            >
              View Details
            </button>
          </div>
        )}

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

        {displayPlan?.budgetAnalysis && (
          <div className="budget-section">
            <h2 className="section-title">Budget Breakdown</h2>
            <div className="budget-grid">
              <div className="budget-item">
                <span className="budget-label">Flights</span>
                <span className="budget-value">${displayPlan.budgetAnalysis.flights.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Accommodation</span>
                <span className="budget-value">${displayPlan.budgetAnalysis.accommodation.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Activities</span>
                <span className="budget-value">${displayPlan.budgetAnalysis.activities.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Meals</span>
                <span className="budget-value">${displayPlan.budgetAnalysis.meals.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Transportation</span>
                <span className="budget-value">${displayPlan.budgetAnalysis.transportation.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Miscellaneous</span>
                <span className="budget-value">${displayPlan.budgetAnalysis.miscellaneous.toFixed(2)}</span>
              </div>
              <div className="budget-item budget-total">
                <span className="budget-label">Total Estimated Cost</span>
                <span className="budget-value">${displayPlan.budgetAnalysis.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {displayPlan?.dailyItinerary && displayPlan.dailyItinerary.length > 0 && (
          <div className="itinerary-section">
            <h2 className="section-title">Daily Itinerary</h2>
            {displayPlan.dailyItinerary.map((day) => (
              <div key={day.day} className="day-card">
                <div className="day-header">
                  <h3 className="day-title">Day {day.day}</h3>
                  <span className="day-date">{formatDate(day.date)}</span>
                </div>

                <div className="day-weather">
                  <div className="weather-summary">
                    <span className="weather-temp">{day.weather.temperature}</span>
                    <span className="weather-condition">{day.weather.condition}</span>
                  </div>
                  <p className="weather-description">{day.weather.description}</p>
                  <p className="weather-recommendation">{day.weather.recommendation}</p>
                </div>

                <div className="activities-section">
                  <h4 className="subsection-title">Activities</h4>
                  {day.activities.map((activity, idx) => (
                    <div key={idx} className="activity-item">
                      <div className="activity-header">
                        <span className="activity-time">{activity.time}</span>
                        <span className="activity-cost">${activity.estimatedCost}</span>
                      </div>
                      <h5 className="activity-name">{activity.name}</h5>
                      <p className="activity-description">{activity.description}</p>
                      {activity.weatherDependent && (
                        <span className="weather-dependent-tag">Weather dependent</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="meals-section">
                  <h4 className="subsection-title">Meals</h4>
                  <div className="meals-grid">
                    {day.meals.map((meal, idx) => (
                      <div key={idx} className="meal-item">
                        <span className="meal-type">{meal.type}</span>
                        <span className="meal-name">{meal.suggestion}</span>
                        <span className="meal-cuisine">{meal.cuisine}</span>
                        <span className="meal-cost">${meal.estimatedCost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {displayPlan?.travelTips && displayPlan.travelTips.length > 0 && (
          <div className="tips-section">
            <h2 className="section-title">Travel Tips</h2>
            <ul className="tips-list">
              {displayPlan.travelTips.map((tip, idx) => (
                <li key={idx} className="tip-item">{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {displayPlan?.packingRecommendations && displayPlan.packingRecommendations.length > 0 && (
          <div className="packing-section">
            <h2 className="section-title">Packing Recommendations</h2>
            <ul className="packing-list">
              {displayPlan.packingRecommendations.map((item, idx) => (
                <li key={idx} className="packing-item">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {displayPlan?.summary && (
          <div className="summary-section">
            <h2 className="section-title">Trip Summary</h2>
            <p className="summary-text">{displayPlan.summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
