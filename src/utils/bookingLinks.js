/**
 * Generate search link for flight booking
 * Uses Google Flights for a universal search experience
 * @param {Object} flight - Flight data from Results
 * @param {Object} tripData - Trip form data with dates
 * @returns {string} Booking search URL
 */
export function generateFlightBookingLink(flight, tripData) {
  try {
    // Use Google Flights as a universal aggregator
    const params = new URLSearchParams();

    // Try to extract airport codes if available
    // Google Flights format: https://www.google.com/travel/flights?q=flights%20from%20JFK%20to%20CDG
    const query = `flights from ${tripData.departFrom} to ${tripData.arriveAt}`;
    params.set('q', query);

    return `https://www.google.com/travel/flights?${params.toString()}`;
  } catch (error) {
    console.error('Error generating flight booking link:', error);
    // Fallback to generic Google search
    return `https://www.google.com/search?q=flights+from+${encodeURIComponent(tripData.departFrom)}+to+${encodeURIComponent(tripData.arriveAt)}`;
  }
}

/**
 * Generate search link for hotel booking
 * Uses Google Hotels for a universal search experience
 * @param {Object} hotel - Hotel data from Results
 * @param {Object} tripData - Trip form data with dates
 * @returns {string} Booking search URL
 */
export function generateHotelBookingLink(hotel, tripData) {
  try {
    // Use Google Hotels as a universal aggregator
    const params = new URLSearchParams();

    // Google Hotels format
    params.set('q', `hotels in ${tripData.arriveAt}`);
    params.set('ts', 'CAESABogCgIaABIaEhQKBwjpDxABGAMSBwjpDxABGA4YATICEAAqA1VTRDoA');

    // Add check-in and check-out dates if available
    if (tripData.departDate && tripData.returnDate) {
      const checkIn = tripData.departDate;
      const checkOut = tripData.returnDate;
      params.set('checkin', checkIn);
      params.set('checkout', checkOut);
    }

    // Add number of travelers
    if (tripData.travelers) {
      params.set('adults', tripData.travelers);
    }

    return `https://www.google.com/travel/hotels?${params.toString()}`;
  } catch (error) {
    console.error('Error generating hotel booking link:', error);
    // Fallback to generic Google search
    return `https://www.google.com/search?q=hotels+in+${encodeURIComponent(tripData.arriveAt)}`;
  }
}

/**
 * Track booking link click for analytics
 * @param {string} type - 'flight' or 'hotel'
 * @param {Object} data - Flight or hotel data
 */
export function trackBookingClick(type, data) {
  try {
    // Track click with Google Analytics if available
    if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
      window.gtag('event', `${type}_booking_click`, {
        [type]: data.name || data.airline || 'unknown',
        cost: data.totalCost || 0
      });
    }

    // Log for development
    console.log(`Booking link clicked: ${type}`, data);
  } catch (error) {
    console.error('Error tracking booking click:', error);
  }
}
