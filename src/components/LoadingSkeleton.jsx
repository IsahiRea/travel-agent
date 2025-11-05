import './LoadingSkeleton.css';

/**
 * Skeleton loader for different sections that shows while data is loading
 * @param {Object} props
 * @param {('weather'|'flight'|'hotel'|'itinerary')} props.type - Type of skeleton to show
 */
export default function LoadingSkeleton({ type }) {
  if (type === 'weather') {
    return (
      <div className="skeleton-card weather-skeleton">
        <div className="skeleton-icon skeleton-shimmer" />
        <div className="skeleton-content">
          <div className="skeleton-title skeleton-shimmer" />
          <div className="skeleton-text skeleton-shimmer" />
          <div className="skeleton-temp-boxes">
            <div className="skeleton-temp skeleton-shimmer" />
            <div className="skeleton-temp skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'flight' || type === 'hotel') {
    return (
      <div className="skeleton-card recommendation-skeleton">
        <div className="skeleton-image skeleton-shimmer" />
        <div className="skeleton-content">
          <div className="skeleton-icon-small skeleton-shimmer" />
          <div className="skeleton-details">
            <div className="skeleton-title skeleton-shimmer" />
            <div className="skeleton-text skeleton-shimmer" />
            <div className="skeleton-tags">
              <div className="skeleton-tag skeleton-shimmer" />
              <div className="skeleton-tag skeleton-shimmer" />
              <div className="skeleton-tag skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'itinerary') {
    return (
      <div className="skeleton-itinerary">
        <div className="skeleton-title skeleton-shimmer" style={{ width: '200px', marginBottom: '1.5rem' }} />
        {[1, 2, 3].map((day) => (
          <div key={day} className="skeleton-day-card">
            <div className="skeleton-day-header">
              <div className="skeleton-title skeleton-shimmer" style={{ width: '100px' }} />
              <div className="skeleton-text skeleton-shimmer" style={{ width: '80px' }} />
            </div>
            <div className="skeleton-text skeleton-shimmer" />
            <div className="skeleton-text skeleton-shimmer" />
            <div className="skeleton-activities">
              {[1, 2].map((activity) => (
                <div key={activity} className="skeleton-activity">
                  <div className="skeleton-text skeleton-shimmer" style={{ width: '60%' }} />
                  <div className="skeleton-text skeleton-shimmer" style={{ width: '80%' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
