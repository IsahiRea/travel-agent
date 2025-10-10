import { useNavigate } from 'react-router-dom';
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

export default function Results() {
  const navigate = useNavigate();

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

      <div className="trip-details">
        <div className="hero-banner">
          <img alt="Paris" className="hero-image" src={imgHeroEiffel} />
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="itinerary-badge">
              <img alt="" className="badge-icon" src={imgIconItinerary} />
              <span className="results-badge-text">Your Itinerary</span>
            </div>
            <div className="hero-info">
              <h1 className="trip-title">Trip to Paris</h1>
              <div className="trip-meta">
                <div className="meta-card">
                  <img alt="" className="meta-icon" src={imgIconCalendar} />
                  <div className="meta-content">
                    <span className="meta-text">Nov 23</span>
                    <img alt="" className="arrow-icon" src={imgIconArrow} />
                    <span className="meta-text">Dec 4</span>
                  </div>
                </div>
                <div className="meta-card">
                  <img alt="" className="meta-icon" src={imgIconLocation} />
                  <div className="meta-content">
                    <span className="meta-text">New York City</span>
                    <img alt="" className="arrow-icon" src={imgIconArrow} />
                    <span className="meta-text">Paris</span>
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
              <span className="info-value">1 Person</span>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon budget-icon" />
            <div className="info-content">
              <span className="info-label">Total Budget</span>
              <span className="info-value">$5000</span>
            </div>
          </div>
        </div>

        <div className="weather-card">
          <div className="weather-icon" />
          <div className="weather-content">
            <h3 className="card-title">Weather Forecast</h3>
            <p className="card-description">
              You can expect the weather to be quite mild. Low will be 19° and high will be 25°
            </p>
            <div className="temp-boxes">
              <div className="temp-box">
                <span className="temp-label">Low</span>
                <span className="temp-value">19°C</span>
              </div>
              <div className="temp-box">
                <span className="temp-label">High</span>
                <span className="temp-value">25°C</span>
              </div>
            </div>
          </div>
        </div>

        <div className="recommendation-card">
          <div className="rec-image-container">
            <img alt="Flight" className="rec-image" src={imgFlightWing} />
            <div className="rec-overlay" />
            <div className="rec-badge best-deal">Best Deal</div>
          </div>
          <div className="rec-content">
            <div className="rec-icon flight-icon" />
            <div className="rec-details">
              <h3 className="card-title">Recommended Flights</h3>
              <p className="card-description">
                The best option for you is with Delta Airlines with a layover in Oslo. Perfect for 1 traveler.
              </p>
              <div className="tag-group">
                <span className="tag">Direct Flight</span>
                <span className="tag">Economy Class</span>
              </div>
            </div>
          </div>
          <button className="book-button">Book Flight</button>
        </div>

        <div className="recommendation-card">
          <div className="rec-image-container">
            <img alt="Hotel" className="rec-image" src={imgHotelRoom} />
            <div className="rec-overlay" />
            <div className="rec-badge rating">4.8★ Rating</div>
          </div>
          <div className="rec-content">
            <div className="rec-icon hotel-icon" />
            <div className="rec-details">
              <h3 className="card-title">Recommended Hotel</h3>
              <p className="card-description">
                We recommend you stay at the Premiere Inn hotel in central Paris. Budget-friendly at $1500 for accommodations.
              </p>
              <div className="tag-group">
                <span className="tag">Free WiFi</span>
                <span className="tag">Breakfast</span>
                <span className="tag">Central Location</span>
              </div>
            </div>
          </div>
          <button className="book-button">Book Hotel</button>
        </div>
      </div>
    </div>
  );
}
