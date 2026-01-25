/**
 * DateSelectionSection Component
 * Date inputs for departure and return (conditional based on trip type)
 */
import { TRIP_CONFIG } from '../../constants/validation';

// Lazy load calendar icon
const imgIconCalendar = new URL(
  '../../assets/images/icons/calendar.svg',
  import.meta.url
).href;

/**
 * @param {Object} props
 * @param {string} props.tripType - 'roundtrip' or 'oneway'
 * @param {string} props.departDate - Departure date value
 * @param {string} props.returnDate - Return date value
 * @param {Function} props.onDepartDateChange - Departure date change handler
 * @param {Function} props.onReturnDateChange - Return date change handler
 * @param {Object} props.fieldErrors - Validation errors object
 */
export default function DateSelectionSection({
  tripType,
  departDate,
  returnDate,
  onDepartDateChange,
  onReturnDateChange,
  fieldErrors,
}) {
  return (
    <div className="date-grid">
      {/* Departure Date */}
      <div className="form-section">
        <label className="form-label" id="departDate-label">
          Departure Date
          <span aria-hidden="true"> *</span>
          <span className="sr-only">required</span>
        </label>
        <div className="input-wrapper">
          <img alt="" className="input-icon" src={imgIconCalendar} />
          <input
            type="date"
            name="departDate"
            className={`date-input ${fieldErrors.departDate ? 'input-error' : ''}`}
            value={departDate}
            onChange={(e) => onDepartDateChange(e.target.value)}
            required
            aria-labelledby="departDate-label"
            aria-required="true"
            aria-invalid={!!fieldErrors.departDate}
            aria-describedby={
              fieldErrors.departDate ? 'departDate-error' : undefined
            }
          />
        </div>
        {fieldErrors.departDate && (
          <span id="departDate-error" className="field-error-message" role="alert">
            {fieldErrors.departDate}
          </span>
        )}
      </div>

      {/* Return Date - Only for round trips */}
      {tripType === TRIP_CONFIG.TYPES.ROUNDTRIP && (
        <div className="form-section">
          <label className="form-label" id="returnDate-label">
            Return Date
            <span aria-hidden="true"> *</span>
            <span className="sr-only">required</span>
          </label>
          <div className="input-wrapper">
            <img alt="" className="input-icon" src={imgIconCalendar} />
            <input
              type="date"
              name="returnDate"
              className={`date-input ${fieldErrors.returnDate ? 'input-error' : ''}`}
              value={returnDate}
              onChange={(e) => onReturnDateChange(e.target.value)}
              required
              aria-labelledby="returnDate-label"
              aria-required="true"
              aria-invalid={!!fieldErrors.returnDate}
              aria-describedby={
                fieldErrors.returnDate ? 'returnDate-error' : undefined
              }
            />
          </div>
          {fieldErrors.returnDate && (
            <span id="returnDate-error" className="field-error-message" role="alert">
              {fieldErrors.returnDate}
            </span>
          )}
        </div>
      )}

      {/* Hidden input for one-way trips */}
      {tripType === 'oneway' && <input type="hidden" name="returnDate" value="" />}
    </div>
  );
}
