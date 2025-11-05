import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import './ErrorDisplay.css';

/**
 * Error display component with retry functionality
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onRetry - Optional retry callback
 */
export default function ErrorDisplay({ message, onRetry }) {
  const navigate = useNavigate();

  return (
    <div className="error-display">
      <div className="error-content">
        <div className="error-icon">
          <Icon name="warning" size={48} color="#d4a574" alt="Warning" />
        </div>
        <h2 className="error-title">Something went wrong</h2>
        <p className="error-message">{message || 'An unexpected error occurred. Please try again.'}</p>

        <div className="error-actions">
          {onRetry && (
            <button className="error-button primary" onClick={onRetry}>
              Try Again
            </button>
          )}
          <button className="error-button secondary" onClick={() => navigate('/planning')}>
            Back to Planning
          </button>
        </div>
      </div>
    </div>
  );
}
