import Icon from '../Icon';
import heroEiffel from '../../assets/images/photos/hero-eiffel.jpg';
import { formatDate } from '../../utils/formatters';
import './styles/ResultsSidebar.css';

export default function ResultsSidebar({ tripData, displayPlan, activeSection }) {
  if (!tripData || !displayPlan) return null;

  // Calculate trip duration
  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const duration = calculateDuration(tripData.departDate, tripData.returnDate);

  // Calculate temperature range from weather data
  const getTempRange = () => {
    if (!displayPlan.rawWeatherData?.forecast) return null;
    const temps = displayPlan.rawWeatherData.forecast;
    const minTemp = Math.min(...temps.map(d => d.tempMin));
    const maxTemp = Math.max(...temps.map(d => d.tempMax));
    return { minTemp, maxTemp };
  };

  const tempRange = getTempRange();

  return (
    <aside className="trip-sidebar">
      {/* Compact Hero Image */}
      <div className="hero-banner-sidebar">
        <img
          src={heroEiffel}
          alt={displayPlan.destination || tripData.arriveAt}
          className="hero-image-sidebar"
        />
        <div className="hero-overlay-sidebar" />
        <div className="hero-content-sidebar">
          <h1 className="trip-title-sidebar">
            {displayPlan.destination || tripData.arriveAt}
          </h1>
        </div>
      </div>

      {/* Quick Info Summary */}
      <div className="quick-info-card">
        <div className="info-item-compact">
          <Icon name="calendar" size={20} color="#6b5d53" alt="Calendar icon" />
          <div className="info-text-compact">
            <div className="info-label-compact">Duration</div>
            <div className="info-value-compact">{duration} days</div>
          </div>
        </div>

        <div className="info-item-compact">
          <Icon name="travelers" size={20} color="#6b5d53" alt="Travelers icon" />
          <div className="info-text-compact">
            <div className="info-label-compact">Travelers</div>
            <div className="info-value-compact">{tripData.travelers}</div>
          </div>
        </div>

        <div className="info-item-compact">
          <Icon name="budget" size={20} color="#6b5d53" alt="Budget icon" />
          <div className="info-text-compact">
            <div className="info-label-compact">Budget</div>
            <div className="info-value-compact">
              ${tripData.budget.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="info-item-compact">
          <Icon name="plane" size={20} color="#6b5d53" alt="Departure icon" />
          <div className="info-text-compact">
            <div className="info-label-compact">Departure</div>
            <div className="info-value-compact">
              {formatDate(tripData.departDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Weather Summary */}
      {tempRange && (
        <div className="weather-compact-card">
          <div className="weather-compact-header">
            <Icon name="weather" size={20} color="#b5654d" alt="Weather icon" />
            <h3 className="weather-compact-title">Weather Forecast</h3>
          </div>
          <div className="temp-range-display">
            <span className="temp-value-large">{Math.round(tempRange.minTemp)}°</span>
            <span className="temp-separator">—</span>
            <span className="temp-value-large">{Math.round(tempRange.maxTemp)}°</span>
          </div>
          <p className="temp-label-text">Temperature range (°C)</p>
        </div>
      )}

      {/* TODO: No icons called info and lightbulb */}
      {/* Sticky Navigation */}
      <nav className="sidebar-nav" aria-label="Trip sections navigation">
        <a
          href="#overview"
          className={`nav-link ${activeSection === 'overview' ? 'active' : ''}`}
        >
          {/* <Icon name="info" size={16} color="currentColor" alt="" /> */}
          Overview
        </a>
        <a
          href="#flights"
          className={`nav-link ${activeSection === 'flights' ? 'active' : ''}`}
        >
          <Icon name="plane" size={16} color="currentColor" alt="" />
          Flight
        </a>
        <a
          href="#hotels"
          className={`nav-link ${activeSection === 'hotels' ? 'active' : ''}`}
        >
          <Icon name="hotel" size={16} color="currentColor" alt="" />
          Hotel
        </a>
        <a
          href="#budget"
          className={`nav-link ${activeSection === 'budget' ? 'active' : ''}`}
        >
          <Icon name="budget" size={16} color="currentColor" alt="" />
          Budget
        </a>
        <a
          href="#itinerary"
          className={`nav-link ${activeSection === 'itinerary' ? 'active' : ''}`}
        >
          <Icon name="plan" size={16} color="currentColor" alt="" />
          Itinerary
        </a>
        <a
          href="#tips"
          className={`nav-link ${activeSection === 'tips' ? 'active' : ''}`}
        >
          {/* <Icon name="lightbulb" size={16} color="currentColor" alt="" /> */}
          Tips
        </a>
      </nav>
    </aside>
  );
}
