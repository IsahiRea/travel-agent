import Icon from '../Icon';
import { generateFlightBookingLink, trackBookingClick } from '../../utils/bookingLinks';
import imgFlightWing from '../../assets/images/photos/flight-wing.jpg';
import './styles/RecommendationCard.css';

export default function FlightCard({ flight, tripData, isStreaming }) {
  const handleBookingClick = () => {
    if (!flight || !tripData) return;

    // Track the click
    trackBookingClick('flight', flight);

    // Generate and open booking link
    const bookingUrl = generateFlightBookingLink(flight, tripData);
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  };

  if (!flight) return null;

  return (
    <div className="recommendation-card">
      <div className="rec-image-container">
        <img alt="Flight" className="rec-image" src={imgFlightWing} />
        <div className="rec-overlay" />
        <div className="rec-badge best-deal">Best Value</div>
        {isStreaming && (
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
            {flight.outboundDetails}
            {flight.returnDetails && ` • ${flight.returnDetails}`}
          </p>
          <div className="tag-group">
            <span className="tag">{flight.airline}</span>
            <span className="tag">${flight.totalCost.toFixed(2)}</span>
            <span className="tag">{tripData.travelers} {tripData.travelers === 1 ? 'Traveler' : 'Travelers'}</span>
          </div>
        </div>
      </div>
      <button
        className="book-button"
        onClick={handleBookingClick}
        aria-label={`Search for ${flight.airline} flights`}
      >
        View Details
      </button>
    </div>
  );
}
