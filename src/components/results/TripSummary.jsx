import './styles/TripSummary.css';

export default function TripSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="summary-section">
      <h2 className="section-title">Trip Summary</h2>
      <p className="summary-text">{summary}</p>
    </div>
  );
}
