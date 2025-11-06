import '../../styles/components/PackingList.css';

export default function PackingList({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="packing-section">
      <h2 className="section-title">Packing Recommendations</h2>
      <ul className="packing-list">
        {items.map((item, idx) => (
          <li key={idx} className="packing-item">{item}</li>
        ))}
      </ul>
    </div>
  );
}
