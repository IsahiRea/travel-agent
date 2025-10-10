import { useState, useActionState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWeatherData, fetchFlightData, fetchHotelData, generateTripPlan } from '../api';
import './Planning.css';
import imgIconBack from '../assets/images/icons/back.svg';
import imgIconMinus from '../assets/images/icons/minus.svg';
import imgIconPlus from '../assets/images/icons/plus.svg';
import imgIconRoute from '../assets/images/icons/route.svg';
import imgIconLocation from '../assets/images/icons/location.svg';
import imgIconSwap from '../assets/images/icons/swap.svg';
import imgIconSwap2 from '../assets/images/icons/swap2.svg';
import imgIconCalendar from '../assets/images/icons/calendar.svg';

export default function Planning() {
  const navigate = useNavigate();
  const [travelers, setTravelers] = useState(1);
  const [departFrom, setDepartFrom] = useState('New York City');
  const [arriveAt, setArriveAt] = useState('Paris');

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

    // Validate form data
    if (!departFrom || !arriveAt || !departDate || !returnDate || !budget) {
      return {
        error: 'Please fill in all required fields',
        message: null
      };
    }

    // Validate dates
    const departDateTime = new Date(departDate);
    const returnDateTime = new Date(returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (departDateTime < today) {
      return {
        error: 'Departure date cannot be in the past',
        message: null
      };
    }

    if (returnDateTime <= departDateTime) {
      return {
        error: 'Return date must be after departure date',
        message: null
      };
    }

    // Validate budget
    if (Number(budget) <= 0) {
      return {
        error: 'Budget must be greater than 0',
        message: null
      };
    }

    try {
      const tripData = {
        travelers: Number(travelers),
        departFrom,
        arriveAt,
        departDate,
        returnDate,
        budget: Number(budget)
      };

      const weatherData = await fetchWeatherData(tripData);
      const flightData = await fetchFlightData(tripData);
      const hotelData = await fetchHotelData(tripData);

      const tripPlan = await generateTripPlan({
        weather: weatherData,
        flights: flightData,
        hotels: hotelData,
        tripData
      });

      navigate('/results', { state: { tripPlan } });

      return {
        error: null,
        message: 'Trip plan generated successfully!'
      };
    } catch (error) {
      console.error('Error generating trip plan:', error);
      return {
        error: 'Failed to generate trip plan. Please try again.',
        message: null
      };
    }
  }

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
            <label className="form-label">Number of Travelers</label>
            <div className="counter-container">
              <button
                type="button"
                className="counter-button"
                onClick={handleDecrement}
                aria-label="Decrease travelers"
              >
                <img alt="" className="counter-icon" src={imgIconMinus} />
              </button>
              <div className="counter-value">{travelers}</div>
              <input
                type="hidden"
                name="travelers"
                value={travelers}
              />
              <button
                type="button"
                className="counter-button"
                onClick={handleIncrement}
                aria-label="Increase travelers"
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
                <label className="form-label">Departing From</label>
                <div className="input-wrapper">
                  <img alt="" className="input-icon" src={imgIconLocation} />
                  <input
                    type="text"
                    name="departFrom"
                    className="location-input"
                    defaultValue={departFrom}
                    placeholder="Enter departure city"
                    required
                  />
                </div>
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
                <label className="form-label">Arriving At</label>
                <div className="input-wrapper">
                  <img alt="" className="input-icon" src={imgIconLocation} />
                  <input
                    type="text"
                    name="arriveAt"
                    className="location-input"
                    defaultValue={arriveAt}
                    placeholder="Enter arrival city"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="date-grid">
            <div className="form-section">
              <label className="form-label">Departure Date</label>
              <div className="input-wrapper">
                <img alt="" className="input-icon" src={imgIconCalendar} />
                <input
                  type="date"
                  name="departDate"
                  className="date-input"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">Return Date</label>
              <div className="input-wrapper">
                <img alt="" className="input-icon" src={imgIconCalendar} />
                <input
                  type="date"
                  name="returnDate"
                  className="date-input"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Budget (USD)</label>
            <div className="input-wrapper">
              <span className="dollar-sign">$</span>
              <input
                type="number"
                name="budget"
                className="budget-input"
                placeholder="Enter budget"
                min="0"
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={isPending}>
            {isPending ? "Planning..." : "Plan my Trip!"}
          </button>
        </form>
      </div>
    </div>
  );
}
