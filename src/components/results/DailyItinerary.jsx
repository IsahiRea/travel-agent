import { formatDate } from '../../utils/formatters';
import './styles/DailyItinerary.css';

export default function DailyItinerary({ itinerary }) {
  if (!itinerary || itinerary.length === 0) return null;

  return (
    <div className="itinerary-section">
      <h2 className="section-title">Daily Itinerary</h2>
      {itinerary.map((day) => (
        <div key={day.day} className="day-card">
          <div className="day-header">
            <h3 className="day-title">Day {day.day}</h3>
            <span className="day-date">{formatDate(day.date)}</span>
          </div>

          <div className="day-weather">
            <div className="weather-summary">
              <span className="weather-temp">{day.weather.temperature}</span>
              <span className="weather-condition">{day.weather.condition}</span>
            </div>
            <p className="weather-description">{day.weather.description}</p>
            <p className="weather-recommendation">{day.weather.recommendation}</p>
          </div>

          <div className="activities-section">
            <h4 className="subsection-title">Activities</h4>
            {day.activities.map((activity, idx) => (
              <div key={idx} className="activity-item">
                <div className="activity-header">
                  <span className="activity-time">{activity.time}</span>
                  <span className="activity-cost">${activity.estimatedCost}</span>
                </div>
                <h5 className="activity-name">{activity.name}</h5>
                <p className="activity-description">{activity.description}</p>
                {activity.weatherDependent && (
                  <span className="weather-dependent-tag">Weather dependent</span>
                )}
              </div>
            ))}
          </div>

          <div className="meals-section">
            <h4 className="subsection-title">Meals</h4>
            <div className="meals-grid">
              {day.meals.map((meal, idx) => (
                <div key={idx} className="meal-item">
                  <span className="meal-type">{meal.type}</span>
                  <span className="meal-name">{meal.suggestion}</span>
                  <span className="meal-cuisine">{meal.cuisine}</span>
                  <span className="meal-cost">${meal.estimatedCost}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
