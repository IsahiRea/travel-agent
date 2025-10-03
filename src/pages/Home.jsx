import { useNavigate } from 'react-router-dom';
import './Home.css';

const imgImageWithFallback = "https://www.figma.com/api/mcp/asset/2430ba0b-0d97-4074-bc62-8aeaee63a487";
const imgIcon = "https://www.figma.com/api/mcp/asset/bb4c9b56-a39b-4d74-b712-c9842742510c";
const imgIcon1 = "https://www.figma.com/api/mcp/asset/3c6e2b69-7d0c-4c16-8f44-e21ef147a1f0";
const imgIcon2 = "https://www.figma.com/api/mcp/asset/9c34680a-0e04-42e6-9c80-be863f95d55e";
const imgIcon3 = "https://www.figma.com/api/mcp/asset/9b50d72a-f852-4194-90f6-edc9d8bbe9e0";
const imgIcon4 = "https://www.figma.com/api/mcp/asset/226e8e04-32d5-45f9-9e09-3bba160cb1e9";

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
