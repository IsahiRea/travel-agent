import { useNavigate } from 'react-router-dom';
import './Home.css';
import imgImageWithFallback from '../assets/images/photos/hero-travel.jpg';
import imgIcon from '../assets/images/icons/journey-badge.svg';
import imgIcon1 from '../assets/images/icons/globe.svg';
import imgIcon2 from '../assets/images/icons/flex-calendar.svg';
import imgIcon3 from '../assets/images/icons/plane.svg';
import imgIcon4 from '../assets/images/icons/dollar.svg';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="home-page">
      <div className="home-content">
        <div className="left-section">
          <div className="header-section">
            <div className="journey-badge">
              <img alt="" className="badge-icon" src={imgIcon} />
              <p className="badge-text">Your Journey Starts Here</p>
            </div>
            <h1 className="main-heading">Plan Your Perfect Trip</h1>
            <p className="main-description">
              Discover amazing destinations, find the best flights and hotels, and create unforgettable memories with our intelligent trip planning assistant.
            </p>
          </div>

          <button className="cta-button" onClick={() => navigate('/planning')}>Get Started</button>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <img alt="" className="feature-icon" src={imgIcon1} />
              </div>
              <h4 className="feature-title">Worldwide Destinations</h4>
              <p className="feature-description">Explore destinations across the globe</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <img alt="" className="feature-icon" src={imgIcon2} />
              </div>
              <h4 className="feature-title">Flexible Dates</h4>
              <p className="feature-description">Find the perfect time for your trip</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <img alt="" className="feature-icon" src={imgIcon3} />
              </div>
              <h4 className="feature-title">Best Flight Deals</h4>
              <p className="feature-description">Compare and book great flights</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <img alt="" className="feature-icon" src={imgIcon4} />
              </div>
              <h4 className="feature-title">Budget Friendly</h4>
              <p className="feature-description">Plan within your budget</p>
            </div>
          </div>
        </div>

        <div className="right-section">
          <div className="hero-image-container">
            <img alt="Travel destination" className="hero-image" src={imgImageWithFallback} />
            <div className="hero-overlay" />
            <div className="stats-container">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">500+</div>
                  <div className="stat-label">Destinations</div>
                </div>
                <div className="stat-item stat-bordered">
                  <div className="stat-value">10K+</div>
                  <div className="stat-label">Travelers</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">4.9★</div>
                  <div className="stat-label">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
