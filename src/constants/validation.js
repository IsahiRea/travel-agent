/**
 * Form Validation Constants
 * Centralized validation rules and error messages
 */

// Validation Error Messages
export const ERROR_MESSAGES = {
  REQUIRED: {
    DEPART_FROM: 'Departure city is required',
    ARRIVE_AT: 'Arrival city is required',
    DEPART_DATE: 'Departure date is required',
    RETURN_DATE: 'Return date is required for round trips',
    BUDGET: 'Budget is required'
  },
  INVALID: {
    BUDGET_POSITIVE: 'Budget must be greater than 0',
    DATE_PAST: 'Departure date cannot be in the past',
    RETURN_BEFORE_DEPART: 'Return date must be after departure date',
    LOCATION_SAME: 'Departure and arrival cities must be different',
    FORM_ERRORS: 'Please correct the errors in the form'
  }
};

// Trip Configuration
export const TRIP_CONFIG = {
  TYPES: {
    ROUNDTRIP: 'roundtrip',
    ONEWAY: 'oneway'
  },
  TRAVELERS: {
    MIN: 1,
    MAX: 9,
    DEFAULT: 1
  },
  BUDGET: {
    MIN: 1,
    MAX: 1000000,
    DEFAULT: 2000
  }
};

// Form Field Names
export const FORM_FIELDS = {
  TRIP_TYPE: 'tripType',
  TRAVELERS: 'travelers',
  DEPART_FROM: 'departFrom',
  ARRIVE_AT: 'arriveAt',
  DEPART_DATE: 'departDate',
  RETURN_DATE: 'returnDate',
  BUDGET: 'budget'
};

// Session Storage Keys
export const STORAGE_KEYS = {
  TRIP_DATA: 'tripPlanData',
  TRIP_TYPE: 'trip-tripType',
  TRAVELERS: 'trip-travelers',
  DEPART_FROM: 'trip-departFrom',
  ARRIVE_AT: 'trip-arriveAt',
  DEPART_DATE: 'trip-departDate',
  RETURN_DATE: 'trip-returnDate',
  BUDGET: 'trip-budget'
};

// Date Validation Helpers
export const DATE_VALIDATION = {
  /**
   * Get today's date with time set to 00:00:00
   * @returns {Date} Today's date
   */
  getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  },

  /**
   * Check if date is in the past
   * @param {string} dateString - Date string to check
   * @returns {boolean} True if date is in the past
   */
  isPastDate(dateString) {
    const date = new Date(dateString);
    return date < this.getToday();
  },

  /**
   * Check if return date is after depart date
   * @param {string} departDateString - Departure date
   * @param {string} returnDateString - Return date
   * @returns {boolean} True if return date is after depart date
   */
  isReturnAfterDepart(departDateString, returnDateString) {
    const departDate = new Date(departDateString);
    const returnDate = new Date(returnDateString);
    return returnDate > departDate;
  }
};

// Field Validation Functions
export const VALIDATORS = {
  /**
   * Validate required text field
   * @param {string} value - Field value
   * @param {string} errorMessage - Error message to return
   * @returns {string|null} Error message or null if valid
   */
  required(value, errorMessage) {
    if (!value || value.trim() === '') {
      return errorMessage;
    }
    return null;
  },

  /**
   * Validate budget is a positive number
   * @param {string|number} value - Budget value
   * @returns {string|null} Error message or null if valid
   */
  budget(value) {
    if (!value) {
      return ERROR_MESSAGES.REQUIRED.BUDGET;
    }
    if (Number(value) <= 0) {
      return ERROR_MESSAGES.INVALID.BUDGET_POSITIVE;
    }
    return null;
  },

  /**
   * Validate departure date
   * @param {string} value - Date string
   * @returns {string|null} Error message or null if valid
   */
  departDate(value) {
    if (!value) {
      return ERROR_MESSAGES.REQUIRED.DEPART_DATE;
    }
    if (DATE_VALIDATION.isPastDate(value)) {
      return ERROR_MESSAGES.INVALID.DATE_PAST;
    }
    return null;
  },

  /**
   * Validate return date for round trips
   * @param {string} returnDate - Return date string
   * @param {string} departDate - Departure date string
   * @param {string} tripType - Trip type (roundtrip/oneway)
   * @returns {string|null} Error message or null if valid
   */
  returnDate(returnDate, departDate, tripType) {
    if (tripType !== TRIP_CONFIG.TYPES.ROUNDTRIP) {
      return null; // No validation needed for one-way trips
    }

    if (!returnDate) {
      return ERROR_MESSAGES.REQUIRED.RETURN_DATE;
    }

    if (departDate && !DATE_VALIDATION.isReturnAfterDepart(departDate, returnDate)) {
      return ERROR_MESSAGES.INVALID.RETURN_BEFORE_DEPART;
    }

    return null;
  }
};
