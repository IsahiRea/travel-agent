import './styles/TravelTips.css';

export default function TravelTips({ tips }) {
  if (!tips || tips.length === 0) return null;

  return (
    <div className="tips-section">
      <h2 className="section-title">Travel Tips</h2>
      <ul className="tips-list">
        {tips.map((tip, idx) => (
          <li key={idx} className="tip-item">{tip}</li>
        ))}
      </ul>
    </div>
  );
}
