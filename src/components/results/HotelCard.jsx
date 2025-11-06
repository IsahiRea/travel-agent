import Icon from '../Icon';
import { generateHotelBookingLink, trackBookingClick } from '../../utils/bookingLinks';
import imgHotelRoom from '../../assets/images/photos/hotel-room.jpg';
import '../../styles/components/RecommendationCard.css';

export default function HotelCard({ hotel, tripData, isStreaming }) {
  const handleBookingClick = () => {
    if (!hotel || !tripData) return;

    // Track the click
    trackBookingClick('hotel', hotel);

    // Generate and open booking link
    const bookingUrl = generateHotelBookingLink(hotel, tripData);
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  };

  if (!hotel) return null;

  return (
    <div className="recommendation-card">
      <div className="rec-image-container">
        <img alt="Hotel" className="rec-image" src={imgHotelRoom} />
        <div className="rec-overlay" />
        <div className="rec-badge rating">{hotel.rating}★ Rating</div>
        {isStreaming && (
          <div className="streaming-overlay">Generating...</div>
        )}
      </div>
      <div className="rec-content">
        <div className="rec-icon">
          <Icon name="hotel" size={24} color="#6b5d53" alt="Hotel" />
        </div>
        <div className="rec-details">
          <h3 className="card-title">{hotel.name}</h3>
          <p className="card-description">
            Located in {hotel.location}. Total cost: ${hotel.totalCost.toFixed(2)} for your stay.
          </p>
          <div className="tag-group">
            {hotel.amenities && hotel.amenities.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="tag">{amenity.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      </div>
      <button
        className="book-button"
        onClick={handleBookingClick}
        aria-label={`Search for ${hotel.name} hotel`}
      >
        View Details
      </button>
    </div>
  );
}
