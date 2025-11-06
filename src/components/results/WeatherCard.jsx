import Icon from '../Icon';
import './styles/WeatherCard.css';

export default function WeatherCard({ weatherData }) {
  if (!weatherData?.forecast || weatherData.forecast.length === 0) {
    return null;
  }

  const minTemp = Math.min(...weatherData.forecast.map(d => d.tempMin));
  const maxTemp = Math.max(...weatherData.forecast.map(d => d.tempMax));

  return (
    <div className="weather-card">
      <div className="weather-icon">
        <Icon name="weather" size={24} color="#6b5d53" alt="Weather" />
      </div>
      <div className="weather-content">
        <h3 className="card-title">Weather Forecast</h3>
        <p className="card-description">
          {weatherData.summary || 'Weather information for your destination.'}
        </p>
        <div className="temp-boxes">
          <div className="temp-box">
            <span className="temp-label">Low</span>
            <span className="temp-value">{minTemp}°C</span>
          </div>
          <div className="temp-box">
            <span className="temp-label">High</span>
            <span className="temp-value">{maxTemp}°C</span>
          </div>
        </div>
      </div>
    </div>
  );
}
