import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useProgressiveTripData } from '../hooks/useProgressiveTripData';
import LoadingProgress from '../components/LoadingProgress';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import './Results.css';
import imgHeroEiffel from '../assets/images/photos/hero-eiffel.jpg';
import imgFlightWing from '../assets/images/photos/flight-wing.jpg';
import imgHotelRoom from '../assets/images/photos/hotel-room.jpg';
const imgIconBack = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%232d2d2d' viewBox='0 0 24 24'%3E%3Cpath d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z'/%3E%3C/svg%3E";
const imgIconPlan = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%232d2d2d' viewBox='0 0 24 24'%3E%3Cpath d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z'/%3E%3C/svg%3E";
const imgIconItinerary = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24'%3E%3Cpath d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z'/%3E%3C/svg%3E";
const imgIconCalendar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24'%3E%3Cpath d='M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z'/%3E%3C/svg%3E";
const imgIconArrow = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24'%3E%3Cpath d='M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z'/%3E%3C/svg%3E";
const imgIconLocation = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E";

//TODO: Refactor page into smaller components for readability
//TODO: Add a way to view full flight/hotel details (e.g. link to provider site)
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

  // Use progressive loading hook
  const { stage, data, error, retry } = useProgressiveTripData(tripData);

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

  return (
    <div className="results-page">
      <div className="results-nav">
        <button className="nav-button" onClick={() => navigate('/planning')}>
          <img alt="" className="nav-icon" src={imgIconBack} />
          <span className="nav-text">Back to Planning</span>
        </button>
        <button className="nav-button secondary" onClick={() => navigate('/planning')}>
          <img alt="" className="nav-icon" src={imgIconPlan} />
          <span className="nav-text">Plan Another Trip</span>
        </button>
      </div>

      {/* Show loading progress while data is being fetched */}
      {stage !== 'complete' && (
        <LoadingProgress currentStage={stage} />
      )}

      <div className="trip-details">
        {tripPlan && (
          <>
            <div className="hero-banner">
              <img alt={tripPlan.destination} className="hero-image" src={imgHeroEiffel} />
              <div className="hero-overlay" />
              <div className="hero-content">
                <div className="itinerary-badge">
                  <img alt="" className="badge-icon" src={imgIconItinerary} />
                  <span className="results-badge-text">Your Itinerary</span>
                </div>
                <div className="hero-info">
                  <h1 className="trip-title">Trip to {tripPlan.destination}</h1>
                  <div className="trip-meta">
                    <div className="meta-card">
                      <img alt="" className="meta-icon" src={imgIconCalendar} />
                      <div className="meta-content">
                        <span className="meta-text">{formatDate(tripData.departDate)}</span>
                        <img alt="" className="arrow-icon" src={imgIconArrow} />
                        <span className="meta-text">{formatDate(tripData.returnDate)}</span>
                      </div>
                    </div>
                    <div className="meta-card">
                      <img alt="" className="meta-icon" src={imgIconLocation} />
                      <div className="meta-content">
                        <span className="meta-text">{tripData.departFrom}</span>
                        <img alt="" className="arrow-icon" src={imgIconArrow} />
                        <span className="meta-text">{tripData.arriveAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon travelers-icon" />
                <div className="info-content">
                  <span className="info-label">Travelers</span>
                  <span className="info-value">
                    {tripData.travelers} {tripData.travelers === 1 ? 'Person' : 'People'}
                  </span>
                </div>
              </div>
              <div className="info-card">
                <div className="info-icon budget-icon" />
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
        {tripPlan?.rawWeatherData && tripPlan.rawWeatherData.forecast && tripPlan.rawWeatherData.forecast.length > 0 && (
          <div className="weather-card">
            <div className="weather-icon" />
            <div className="weather-content">
              <h3 className="card-title">Weather Forecast</h3>
              <p className="card-description">
                {tripPlan.rawWeatherData.summary || 'Weather information for your destination.'}
              </p>
              <div className="temp-boxes">
                <div className="temp-box">
                  <span className="temp-label">Low</span>
                  <span className="temp-value">
                    {Math.min(...tripPlan.rawWeatherData.forecast.map(d => d.tempMin))}°C
                  </span>
                </div>
                <div className="temp-box">
                  <span className="temp-label">High</span>
                  <span className="temp-value">
                    {Math.max(...tripPlan.rawWeatherData.forecast.map(d => d.tempMax))}°C
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
        {tripPlan?.selectedFlight && (
          <div className="recommendation-card">
            <div className="rec-image-container">
              <img alt="Flight" className="rec-image" src={imgFlightWing} />
              <div className="rec-overlay" />
              <div className="rec-badge best-deal">Best Value</div>
            </div>
            <div className="rec-content">
              <div className="rec-icon flight-icon" />
              <div className="rec-details">
                <h3 className="card-title">Recommended Flight</h3>
                <p className="card-description">
                  {tripPlan.selectedFlight.outboundDetails}
                  {tripPlan.selectedFlight.returnDetails && ` • ${tripPlan.selectedFlight.returnDetails}`}
                </p>
                <div className="tag-group">
                  <span className="tag">{tripPlan.selectedFlight.airline}</span>
                  <span className="tag">${tripPlan.selectedFlight.totalCost.toFixed(2)}</span>
                  <span className="tag">{tripData.travelers} {tripData.travelers === 1 ? 'Traveler' : 'Travelers'}</span>
                </div>
              </div>
            </div>
            <button className="book-button">View Details</button>
          </div>
        )}

        {/* Hotel Section - Show skeleton while loading */}
        {!hotelData && (stage === 'hotels' || (stage !== 'complete' && stage !== 'initializing' && stage !== 'weather' && stage !== 'flights')) && (
          <LoadingSkeleton type="hotel" />
        )}
        {tripPlan?.selectedHotel && (
          <div className="recommendation-card">
            <div className="rec-image-container">
              <img alt="Hotel" className="rec-image" src={imgHotelRoom} />
              <div className="rec-overlay" />
              <div className="rec-badge rating">{tripPlan.selectedHotel.rating}★ Rating</div>
            </div>
            <div className="rec-content">
              <div className="rec-icon hotel-icon" />
              <div className="rec-details">
                <h3 className="card-title">{tripPlan.selectedHotel.name}</h3>
                <p className="card-description">
                  Located in {tripPlan.selectedHotel.location}. Total cost: ${tripPlan.selectedHotel.totalCost.toFixed(2)} for your stay.
                </p>
                <div className="tag-group">
                  {tripPlan.selectedHotel.amenities && tripPlan.selectedHotel.amenities.slice(0, 3).map((amenity, idx) => (
                    <span key={idx} className="tag">{amenity.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            </div>
            <button className="book-button">View Details</button>
          </div>
        )}

        {/* Itinerary Section - Show skeleton while loading */}
        {!tripPlan && stage === 'ai' && (
          <LoadingSkeleton type="itinerary" />
        )}

        {tripPlan?.budgetAnalysis && (
          <div className="budget-section">
            <h2 className="section-title">Budget Breakdown</h2>
            <div className="budget-grid">
              <div className="budget-item">
                <span className="budget-label">Flights</span>
                <span className="budget-value">${tripPlan.budgetAnalysis.flights.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Accommodation</span>
                <span className="budget-value">${tripPlan.budgetAnalysis.accommodation.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Activities</span>
                <span className="budget-value">${tripPlan.budgetAnalysis.activities.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Meals</span>
                <span className="budget-value">${tripPlan.budgetAnalysis.meals.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Transportation</span>
                <span className="budget-value">${tripPlan.budgetAnalysis.transportation.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Miscellaneous</span>
                <span className="budget-value">${tripPlan.budgetAnalysis.miscellaneous.toFixed(2)}</span>
              </div>
              <div className="budget-item budget-total">
                <span className="budget-label">Total Estimated Cost</span>
                <span className="budget-value">${tripPlan.budgetAnalysis.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {tripPlan?.dailyItinerary && tripPlan.dailyItinerary.length > 0 && (
          <div className="itinerary-section">
            <h2 className="section-title">Daily Itinerary</h2>
            {tripPlan.dailyItinerary.map((day) => (
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

        {tripPlan?.travelTips && tripPlan.travelTips.length > 0 && (
          <div className="tips-section">
            <h2 className="section-title">Travel Tips</h2>
            <ul className="tips-list">
              {tripPlan.travelTips.map((tip, idx) => (
                <li key={idx} className="tip-item">{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {tripPlan?.packingRecommendations && tripPlan.packingRecommendations.length > 0 && (
          <div className="packing-section">
            <h2 className="section-title">Packing Recommendations</h2>
            <ul className="packing-list">
              {tripPlan.packingRecommendations.map((item, idx) => (
                <li key={idx} className="packing-item">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {tripPlan?.summary && (
          <div className="summary-section">
            <h2 className="section-title">Trip Summary</h2>
            <p className="summary-text">{tripPlan.summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
