/**
 * useTripPlanningForm Hook
 * Manages form state, validation, and actions for trip planning
 */
import { useState, useCallback } from 'react';
import { usePersistedState } from './usePersistedState';
import {
  ERROR_MESSAGES,
  TRIP_CONFIG,
  VALIDATORS,
} from '../constants/validation';

// Initial field errors state
const INITIAL_FIELD_ERRORS = {
  departFrom: null,
  arriveAt: null,
  departDate: null,
  returnDate: null,
  budget: null,
};

/**
 * Custom hook for trip planning form state management
 * @returns {Object} Form state, actions, errors, and validation
 */
export function useTripPlanningForm() {
  // Persisted form field state
  const [tripType, setTripType] = usePersistedState(
    'trip-type',
    TRIP_CONFIG.TYPES.ROUNDTRIP
  );
  const [travelers, setTravelers] = usePersistedState(
    'trip-travelers',
    TRIP_CONFIG.TRAVELERS.DEFAULT
  );
  const [departFrom, setDepartFrom] = usePersistedState(
    'trip-departFrom',
    'New York City'
  );
  const [arriveAt, setArriveAt] = usePersistedState('trip-arriveAt', 'Paris');
  const [departDate, setDepartDate] = usePersistedState('trip-departDate', '');
  const [returnDate, setReturnDate] = usePersistedState('trip-returnDate', '');
  const [budget, setBudget] = usePersistedState('trip-budget', '');

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState(INITIAL_FIELD_ERRORS);

  // Form actions
  const handleIncrement = useCallback(() => {
    setTravelers((prev) => Math.min(TRIP_CONFIG.TRAVELERS.MAX, prev + 1));
  }, [setTravelers]);

  const handleDecrement = useCallback(() => {
    setTravelers((prev) => Math.max(TRIP_CONFIG.TRAVELERS.MIN, prev - 1));
  }, [setTravelers]);

  const handleSwapLocations = useCallback(() => {
    const tempDepartFrom = departFrom;
    setDepartFrom(arriveAt);
    setArriveAt(tempDepartFrom);
  }, [departFrom, arriveAt, setDepartFrom, setArriveAt]);

  /**
   * Validate form data from FormData object
   * @param {FormData} formData - Form data to validate
   * @returns {{ errors: Object, hasError: boolean, tripData: Object|null }}
   */
  const validateForm = useCallback(
    (formData) => {
      const data = {
        travelers: formData.get('travelers'),
        departFrom: formData.get('departFrom'),
        arriveAt: formData.get('arriveAt'),
        departDate: formData.get('departDate'),
        returnDate: formData.get('returnDate'),
        budget: formData.get('budget'),
        tripType: formData.get('tripType') || tripType,
      };

      const errors = { ...INITIAL_FIELD_ERRORS };
      let hasError = false;

      // Validate each field
      errors.departFrom = VALIDATORS.required(
        data.departFrom,
        ERROR_MESSAGES.REQUIRED.DEPART_FROM
      );
      if (errors.departFrom) hasError = true;

      errors.arriveAt = VALIDATORS.required(
        data.arriveAt,
        ERROR_MESSAGES.REQUIRED.ARRIVE_AT
      );
      if (errors.arriveAt) hasError = true;

      errors.departDate = VALIDATORS.departDate(data.departDate);
      if (errors.departDate) hasError = true;

      errors.returnDate = VALIDATORS.returnDate(
        data.returnDate,
        data.departDate,
        data.tripType
      );
      if (errors.returnDate) hasError = true;

      errors.budget = VALIDATORS.budget(data.budget);
      if (errors.budget) hasError = true;

      // Update field errors state
      setFieldErrors(errors);

      // Build trip data object if valid
      const tripData = hasError
        ? null
        : {
            tripType: data.tripType,
            travelers: Number(data.travelers),
            departFrom: data.departFrom,
            arriveAt: data.arriveAt,
            departDate: data.departDate,
            returnDate:
              data.tripType === TRIP_CONFIG.TYPES.ROUNDTRIP
                ? data.returnDate
                : null,
            budget: Number(data.budget),
          };

      return { errors, hasError, tripData };
    },
    [tripType, setFieldErrors]
  );

  /**
   * Focus on first invalid field
   */
  const focusFirstError = useCallback(() => {
    const firstErrorField = Object.keys(fieldErrors).find(
      (key) => fieldErrors[key]
    );
    if (firstErrorField) {
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.focus();
      }
    }
  }, [fieldErrors]);

  return {
    // Form state
    formState: {
      tripType,
      travelers,
      departFrom,
      arriveAt,
      departDate,
      returnDate,
      budget,
    },
    // State setters
    setters: {
      setTripType,
      setTravelers,
      setDepartFrom,
      setArriveAt,
      setDepartDate,
      setReturnDate,
      setBudget,
    },
    // Form actions
    actions: {
      handleIncrement,
      handleDecrement,
      handleSwapLocations,
    },
    // Validation
    fieldErrors,
    validateForm,
    focusFirstError,
  };
}
