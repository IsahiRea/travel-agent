/**
 * Extract airport code from flight details string
 * @param {string} details - Flight details string (e.g., "JFK to CDG via American Airlines")
 * @returns {string|null} Airport code or null
 */
function extractAirportCode(details) {
  if (!details) return null;
  // Match 3-letter airport codes (e.g., JFK, LAX, CDG)
  const match = details.match(/\b([A-Z]{3})\b/);
  return match ? match[1] : null;
}

/**
 * Generate search link for flight booking
 * Uses Google Flights for a universal search experience with specific airport codes
 * @param {Object} flight - Flight data from Results
 * @param {Object} tripData - Trip form data with dates
 * @returns {string} Booking search URL
 */
export function generateFlightBookingLink(flight, tripData) {
  try {
    // Extract airport codes from flight details if available
    const originCode = extractAirportCode(flight.outboundDetails);
    const destCode = extractAirportCode(flight.outboundDetails?.split(' to ')[1]);

    // Build Google Flights URL with specific parameters
    if (originCode && destCode && tripData.departDate) {
      // Google Flights deep link format
      const baseUrl = 'https://www.google.com/travel/flights';
      const params = new URLSearchParams();

      // Format: flights from ORIGIN to DEST on YYYY-MM-DD
      let query = `flights from ${originCode} to ${destCode}`;
      if (tripData.departDate) {
        query += ` on ${tripData.departDate}`;
      }
      if (tripData.returnDate) {
        query += ` returning ${tripData.returnDate}`;
      }

      params.set('q', query);

      // Add travelers
      if (tripData.travelers > 1) {
        params.set('curr', 'USD');
        params.set('hl', 'en');
      }

      return `${baseUrl}?${params.toString()}`;
    }

    // Fallback to city-based search
    const params = new URLSearchParams();
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
 * Uses Google Hotels with specific hotel name and dates
 * @param {Object} hotel - Hotel data from Results
 * @param {Object} tripData - Trip form data with dates
 * @returns {string} Booking search URL
 */
export function generateHotelBookingLink(hotel, tripData) {
  try {
    const params = new URLSearchParams();

    // Use specific hotel name if available, otherwise city
    const searchQuery = hotel.name
      ? `${hotel.name} ${hotel.location || tripData.arriveAt}`
      : `hotels in ${tripData.arriveAt}`;

    params.set('q', searchQuery);

    // Add check-in and check-out dates if available
    if (tripData.departDate && tripData.returnDate) {
      params.set('checkin', tripData.departDate);
      params.set('checkout', tripData.returnDate);
    }

    // Add number of travelers
    if (tripData.travelers) {
      params.set('adults', tripData.travelers.toString());
    }

    // Set currency and language
    params.set('curr', 'USD');
    params.set('hl', 'en');

    return `https://www.google.com/travel/hotels?${params.toString()}`;
  } catch (error) {
    console.error('Error generating hotel booking link:', error);
    // Fallback to generic Google search with hotel name
    const query = hotel?.name
      ? `${hotel.name} hotel booking`
      : `hotels in ${tripData.arriveAt}`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
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
