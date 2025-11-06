import Icon from '../Icon';
import './styles/TripInfoCards.css';

export default function TripInfoCards({ tripData }) {
  return (
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
  );
}
