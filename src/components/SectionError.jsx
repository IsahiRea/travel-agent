import Icon from './Icon';
import '../styles/components/SectionError.css';

/**
 * Inline error display for individual sections with retry
 * @param {Object} props
 * @param {string} props.section - Section name (weather, flights, hotels)
 * @param {string} props.message - Error message
 * @param {Function} props.onRetry - Retry callback for this section
 */
export default function SectionError({ section, message, onRetry }) {
  const labels = {
    weather: 'Weather',
    flights: 'Flights',
    hotels: 'Hotels',
    plan: 'Trip Plan'
  };

  return (
    <div className="section-error">
      <div className="section-error-icon">
        <Icon name="warning" size={24} color="#d4a574" alt="Warning" />
      </div>
      <div className="section-error-content">
        <p className="section-error-title">
          {labels[section] || section} unavailable
        </p>
        <p className="section-error-message">
          {message || 'Failed to load data'}
        </p>
      </div>
      {onRetry && (
        <button className="section-error-retry" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
