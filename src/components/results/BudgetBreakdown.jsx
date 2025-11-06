import '../../styles/components/BudgetBreakdown.css';

export default function BudgetBreakdown({ budgetAnalysis }) {
  if (!budgetAnalysis) return null;

  const budgetItems = [
    { label: 'Flights', value: budgetAnalysis.flights },
    { label: 'Accommodation', value: budgetAnalysis.accommodation },
    { label: 'Activities', value: budgetAnalysis.activities },
    { label: 'Meals', value: budgetAnalysis.meals },
    { label: 'Transportation', value: budgetAnalysis.transportation },
    { label: 'Miscellaneous', value: budgetAnalysis.miscellaneous },
  ];

  return (
    <div className="budget-section">
      <h2 className="section-title">Budget Breakdown</h2>
      <div className="budget-grid">
        {budgetItems.map(item => (
          <div key={item.label} className="budget-item">
            <span className="budget-label">{item.label}</span>
            <span className="budget-value">${item.value.toFixed(2)}</span>
          </div>
        ))}
        <div className="budget-item budget-total">
          <span className="budget-label">Total Estimated Cost</span>
          <span className="budget-value">${budgetAnalysis.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
