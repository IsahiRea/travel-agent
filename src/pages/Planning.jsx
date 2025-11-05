import { useState, useActionState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Planning.css';

// Lazy load SVG icons to reduce initial bundle size
// Vite will handle these efficiently and they'll be included in the Planning chunk
const imgIconBack = new URL('../assets/images/icons/back.svg', import.meta.url).href;
const imgIconMinus = new URL('../assets/images/icons/minus.svg', import.meta.url).href;
const imgIconPlus = new URL('../assets/images/icons/plus.svg', import.meta.url).href;
const imgIconRoute = new URL('../assets/images/icons/route.svg', import.meta.url).href;
const imgIconLocation = new URL('../assets/images/icons/location.svg', import.meta.url).href;
const imgIconSwap = new URL('../assets/images/icons/swap.svg', import.meta.url).href;
const imgIconSwap2 = new URL('../assets/images/icons/swap2.svg', import.meta.url).href;
const imgIconCalendar = new URL('../assets/images/icons/calendar.svg', import.meta.url).href;

//TODO: Add location autocomplete (e.g. Google Places API) for depart/arrive fields
//TODO: Save form state in localStorage to persist on refresh
//TODO: Add option for one-way trips (hide return date)


export default function Planning() {
  const navigate = useNavigate();
  const [travelers, setTravelers] = useState(1);
  const [departFrom, setDepartFrom] = useState('New York City');
  const [arriveAt, setArriveAt] = useState('Paris');

  // Field-level error state for validation feedback
  const [fieldErrors, setFieldErrors] = useState({
    departFrom: null,
    arriveAt: null,
    departDate: null,
    returnDate: null,
    budget: null
  });

  const handleIncrement = () => setTravelers(prev => prev + 1);
  const handleDecrement = () => setTravelers(prev => Math.max(1, prev - 1));

  const handleSwapLocations = () => {
    setDepartFrom(arriveAt);
    setArriveAt(departFrom);
  };
  
  const [state, actionFunction, isPending] = useActionState(
    handleSubmission,
    {
      error: null,
      message: null
    }
  );

  async function handleSubmission(_prevState, formData) {
    // Extract form data
    const travelers = formData.get('travelers');
    const departFrom = formData.get('departFrom');
    const arriveAt = formData.get('arriveAt');
    const departDate = formData.get('departDate');
    const returnDate = formData.get('returnDate');
    const budget = formData.get('budget');

    // Reset field errors
    const errors = {
      departFrom: null,
      arriveAt: null,
      departDate: null,
      returnDate: null,
      budget: null
    };

    let hasError = false;

    // Validate form data - set specific field errors
    if (!departFrom || departFrom.trim() === '') {
      errors.departFrom = 'Departure city is required';
      hasError = true;
    }

    if (!arriveAt || arriveAt.trim() === '') {
      errors.arriveAt = 'Arrival city is required';
      hasError = true;
    }

    if (!departDate) {
      errors.departDate = 'Departure date is required';
      hasError = true;
    }

    if (!returnDate) {
      errors.returnDate = 'Return date is required';
      hasError = true;
    }

    if (!budget) {
      errors.budget = 'Budget is required';
      hasError = true;
    } else if (Number(budget) <= 0) {
      errors.budget = 'Budget must be greater than 0';
      hasError = true;
    }

    // Validate dates if both are provided
    if (departDate && returnDate) {
      const departDateTime = new Date(departDate);
      const returnDateTime = new Date(returnDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (departDateTime < today) {
        errors.departDate = 'Departure date cannot be in the past';
        hasError = true;
      }

      if (returnDateTime <= departDateTime) {
        errors.returnDate = 'Return date must be after departure date';
        hasError = true;
      }
    }

    // Update field errors state
    setFieldErrors(errors);

    // If there are errors, return early
    if (hasError) {
      return {
        error: 'Please correct the errors in the form',
        message: null
      };
    }

    // Create trip data object
    const tripData = {
      travelers: Number(travelers),
      departFrom,
      arriveAt,
      departDate,
      returnDate,
      budget: Number(budget)
    };

    console.log('Saving trip form data and navigating to results...');

    // Store form data in sessionStorage
    try {
      sessionStorage.setItem('tripFormData', JSON.stringify(tripData));
    } catch (storageError) {
      console.error('Failed to store form data in sessionStorage:', storageError);
      return {
        error: 'Failed to save form data. Please try again.',
        message: null
      };
    }

    // Navigate immediately to results page
    // The Results page will handle progressive data loading
    navigate('/results');

    return {
      error: null,
      message: 'Loading trip data...'
    };
  }

  // Focus first invalid field when errors occur
  useEffect(() => {
    if (state?.error) {
      const firstErrorField = Object.keys(fieldErrors).find(key => fieldErrors[key]);
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.focus();
        }
      }
    }
  }, [state?.error, fieldErrors]);

  return (
    <div className="planning-page">
      <button className="back-button" onClick={() => navigate('/')}>
        <img alt="" className="back-icon" src={imgIconBack} />
        <span className="back-text">Back to Home</span>
      </button>

      <div className="planning-container">
        <form className="trip-planner" action={actionFunction}>
          <div className="header-section">
            <h1 className="planning-heading">Plan Your Trip</h1>
            <p className="planning-subtitle">Let's create your perfect journey</p>
          </div>

          {state?.error && (
            <div className="form-message error-message" role="alert">
              {state.error}
            </div>
          )}

          {state?.message && (
            <div className="form-message success-message" role="status">
              {state.message}
            </div>
          )}

          <div className="form-section">
            <label className="form-label" id="travelers-label">Number of Travelers</label>
            <div className="counter-container" role="group" aria-labelledby="travelers-label">
              <button
                type="button"
                className="counter-button"
                onClick={handleDecrement}
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
                {travelers}
              </div>
              <input
                type="hidden"
                name="travelers"
                value={travelers}
              />
              <button
                type="button"
                className="counter-button"
                onClick={handleIncrement}
                aria-label="Increase number of travelers"
                aria-controls="travelers-value"
              >
                <img alt="" className="counter-icon" src={imgIconPlus} />
              </button>
            </div>
          </div>

          <div className="route-section">
            <div className="route-header">
              <img alt="" className="route-icon" src={imgIconRoute} />
              <span className="route-label">Flight Route</span>
            </div>

            <div className="location-fields">
              <div className="form-section">
                <label className="form-label" id="departFrom-label">
                  Departing From
                  <span aria-hidden="true"> *</span>
                  <span className="sr-only">required</span>
                </label>
                <div className="input-wrapper">
                  <img alt="" className="input-icon" src={imgIconLocation} />
                  <input
                    type="text"
                    name="departFrom"
                    className={`location-input ${fieldErrors.departFrom ? 'input-error' : ''}`}
                    value={departFrom}
                    onChange={(e) => setDepartFrom(e.target.value)}
                    placeholder="Enter departure city"
                    required
                    aria-labelledby="departFrom-label"
                    aria-required="true"
                    aria-invalid={!!fieldErrors.departFrom}
                    aria-describedby={fieldErrors.departFrom ? 'departFrom-error' : undefined}
                  />
                </div>
                {fieldErrors.departFrom && (
                  <span id="departFrom-error" className="field-error-message" role="alert">
                    {fieldErrors.departFrom}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="swap-button"
                onClick={handleSwapLocations}
                aria-label="Swap locations"
              >
                <div className="swap-icon">
                  <img alt="" className="swap-arrow" src={imgIconSwap} />
                  <img alt="" className="swap-arrow" src={imgIconSwap2} />
                </div>
              </button>

              <div className="form-section">
                <label className="form-label" id="arriveAt-label">
                  Arriving At
                  <span aria-hidden="true"> *</span>
                  <span className="sr-only">required</span>
                </label>
                <div className="input-wrapper">
                  <img alt="" className="input-icon" src={imgIconLocation} />
                  <input
                    type="text"
                    name="arriveAt"
                    className={`location-input ${fieldErrors.arriveAt ? 'input-error' : ''}`}
                    value={arriveAt}
                    onChange={(e) => setArriveAt(e.target.value)}
                    placeholder="Enter arrival city"
                    required
                    aria-labelledby="arriveAt-label"
                    aria-required="true"
                    aria-invalid={!!fieldErrors.arriveAt}
                    aria-describedby={fieldErrors.arriveAt ? 'arriveAt-error' : undefined}
                  />
                </div>
                {fieldErrors.arriveAt && (
                  <span id="arriveAt-error" className="field-error-message" role="alert">
                    {fieldErrors.arriveAt}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="date-grid">
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
                  required
                  aria-labelledby="departDate-label"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.departDate}
                  aria-describedby={fieldErrors.departDate ? 'departDate-error' : undefined}
                />
              </div>
              {fieldErrors.departDate && (
                <span id="departDate-error" className="field-error-message" role="alert">
                  {fieldErrors.departDate}
                </span>
              )}
            </div>

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
                  required
                  aria-labelledby="returnDate-label"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.returnDate}
                  aria-describedby={fieldErrors.returnDate ? 'returnDate-error' : undefined}
                />
              </div>
              {fieldErrors.returnDate && (
                <span id="returnDate-error" className="field-error-message" role="alert">
                  {fieldErrors.returnDate}
                </span>
              )}
            </div>
          </div>

          <div className="form-section">
            <label className="form-label" id="budget-label">
              Budget (USD)
              <span aria-hidden="true"> *</span>
              <span className="sr-only">required</span>
            </label>
            <div className="input-wrapper">
              <span className="dollar-sign">$</span>
              <input
                type="number"
                name="budget"
                className={`budget-input ${fieldErrors.budget ? 'input-error' : ''}`}
                placeholder="Enter budget"
                min="0"
                required
                aria-labelledby="budget-label"
                aria-required="true"
                aria-invalid={!!fieldErrors.budget}
                aria-describedby={fieldErrors.budget ? 'budget-error' : undefined}
              />
            </div>
            {fieldErrors.budget && (
              <span id="budget-error" className="field-error-message" role="alert">
                {fieldErrors.budget}
              </span>
            )}
          </div>

          <button type="submit" className="submit-button" disabled={isPending}>
            {isPending ? "Planning..." : "Plan my Trip!"}
          </button>

          {/* Live region for form status - screen reader only */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {isPending ? 'Planning your trip, please wait...' : ''}
          </div>
        </form>
      </div>
    </div>
  );
}
