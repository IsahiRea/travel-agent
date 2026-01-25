import { useActionState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { TravelerCounter, DateSelectionSection } from '../components/planning';
import { useTripPlanningForm } from '../hooks/useTripPlanningForm';
import { ROUTES } from '../constants/routes';
import { ERROR_MESSAGES, TRIP_CONFIG } from '../constants/validation';
import '../styles/pages/Planning.css';

// Lazy load SVG icons to reduce initial bundle size
const imgIconBack = new URL('../assets/images/icons/back.svg', import.meta.url).href;
const imgIconRoute = new URL('../assets/images/icons/route.svg', import.meta.url).href;
const imgIconLocation = new URL('../assets/images/icons/location.svg', import.meta.url).href;
const imgIconSwap = new URL('../assets/images/icons/swap.svg', import.meta.url).href;
const imgIconSwap2 = new URL('../assets/images/icons/swap2.svg', import.meta.url).href;

export default function Planning() {
  const navigate = useNavigate();

  // Use custom hook for form state management
  const {
    formState,
    setters,
    actions,
    fieldErrors,
    validateForm,
    focusFirstError,
  } = useTripPlanningForm();

  const [state, actionFunction, isPending] = useActionState(
    async (_prevState, formData) => {
      const { hasError, tripData } = validateForm(formData);

      if (hasError) {
        return { error: ERROR_MESSAGES.INVALID.FORM_ERRORS, message: null };
      }

      console.log('Saving trip form data and navigating to results...');

      try {
        sessionStorage.setItem('tripFormData', JSON.stringify(tripData));
      } catch (storageError) {
        console.error('Failed to store form data in sessionStorage:', storageError);
        return { error: 'Failed to save form data. Please try again.', message: null };
      }

      navigate(ROUTES.RESULTS);
      return { error: null, message: 'Loading trip data...' };
    },
    { error: null, message: null }
  );

  // Focus first invalid field when errors occur
  useEffect(() => {
    if (state?.error) {
      focusFirstError();
    }
  }, [state?.error, focusFirstError]);

  return (
    <div className="planning-page">
      <button className="back-button" onClick={() => navigate(ROUTES.HOME)}>
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

          {/* Trip Type Toggle */}
          <div className="form-section">
            <label className="form-label" id="tripType-label">Trip Type</label>
            <div className="trip-type-toggle" role="group" aria-labelledby="tripType-label">
              <button
                type="button"
                className={`toggle-option ${formState.tripType === TRIP_CONFIG.TYPES.ROUNDTRIP ? 'active' : ''}`}
                onClick={() => setters.setTripType(TRIP_CONFIG.TYPES.ROUNDTRIP)}
                aria-pressed={formState.tripType === TRIP_CONFIG.TYPES.ROUNDTRIP}
              >
                Round Trip
              </button>
              <button
                type="button"
                className={`toggle-option ${formState.tripType === 'oneway' ? 'active' : ''}`}
                onClick={() => setters.setTripType('oneway')}
                aria-pressed={formState.tripType === 'oneway'}
              >
                One Way
              </button>
            </div>
            <input type="hidden" name="tripType" value={formState.tripType} />
          </div>

          {/* Traveler Counter */}
          <TravelerCounter
            value={formState.travelers}
            onIncrement={actions.handleIncrement}
            onDecrement={actions.handleDecrement}
          />

          {/* Route Section - Locations */}
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
                  <LocationAutocomplete
                    name="departFrom"
                    value={formState.departFrom}
                    onChange={setters.setDepartFrom}
                    placeholder="Enter departure city"
                    required
                    hasError={!!fieldErrors.departFrom}
                    ariaDescribedby={fieldErrors.departFrom ? 'departFrom-error' : undefined}
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
                onClick={actions.handleSwapLocations}
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
                  <LocationAutocomplete
                    name="arriveAt"
                    value={formState.arriveAt}
                    onChange={setters.setArriveAt}
                    placeholder="Enter arrival city"
                    required
                    hasError={!!fieldErrors.arriveAt}
                    ariaDescribedby={fieldErrors.arriveAt ? 'arriveAt-error' : undefined}
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

          {/* Date Selection */}
          <DateSelectionSection
            tripType={formState.tripType}
            departDate={formState.departDate}
            returnDate={formState.returnDate}
            onDepartDateChange={setters.setDepartDate}
            onReturnDateChange={setters.setReturnDate}
            fieldErrors={fieldErrors}
          />

          {/* Budget Section */}
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
                value={formState.budget}
                onChange={(e) => setters.setBudget(e.target.value)}
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
