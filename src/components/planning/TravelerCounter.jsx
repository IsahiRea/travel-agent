/**
 * TravelerCounter Component
 * Increment/decrement counter for number of travelers
 */

// Lazy load SVG icons
const imgIconMinus = new URL(
  '../../assets/images/icons/minus.svg',
  import.meta.url
).href;
const imgIconPlus = new URL(
  '../../assets/images/icons/plus.svg',
  import.meta.url
).href;

/**
 * @param {Object} props
 * @param {number} props.value - Current traveler count
 * @param {Function} props.onIncrement - Increment callback
 * @param {Function} props.onDecrement - Decrement callback
 */
export default function TravelerCounter({ value, onIncrement, onDecrement }) {
  return (
    <div className="form-section">
      <label className="form-label" id="travelers-label">
        Number of Travelers
      </label>
      <div
        className="counter-container"
        role="group"
        aria-labelledby="travelers-label"
      >
        <button
          type="button"
          className="counter-button"
          onClick={onDecrement}
          aria-label="Decrease number of travelers"
          aria-controls="travelers-value"
        >
          <img alt="" className="counter-icon" src={imgIconMinus} />
        </button>
        <div
          id="travelers-value"
          className="counter-value"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="sr-only">Number of travelers: </span>
          {value}
        </div>
        <input type="hidden" name="travelers" value={value} />
        <button
          type="button"
          className="counter-button"
          onClick={onIncrement}
          aria-label="Increase number of travelers"
          aria-controls="travelers-value"
        >
          <img alt="" className="counter-icon" src={imgIconPlus} />
        </button>
      </div>
    </div>
  );
}
