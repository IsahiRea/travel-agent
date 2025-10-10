import { useState, useActionState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWeatherData, fetchFlightData, fetchHotelData, generateTripPlan } from '../api';
import './Planning.css';

const imgIconBack = "https://www.figma.com/api/mcp/asset/59adbe4d-a02a-4ca7-a52b-52647728cc69";
const imgIconMinus = "https://www.figma.com/api/mcp/asset/4b7e8fd6-9424-41c3-843a-ec7b76d2b27e";
const imgIconPlus = "https://www.figma.com/api/mcp/asset/030bdd0b-8c7d-439d-bb87-a2a772f53c87";
const imgIconRoute = "https://www.figma.com/api/mcp/asset/d2168abf-8305-4ce8-a251-d35dc2e85bde";
const imgIconLocation = "https://www.figma.com/api/mcp/asset/626b0c66-5e00-4ba5-aa75-4a965e7ad8b2";
const imgIconSwap = "https://www.figma.com/api/mcp/asset/740af55e-cd6e-4175-8760-93ea30994a8b";
// const imgIconSwap2 = "https://www.figma.com/api/mcp/asset/b9cb29eb-5a8a-4b48-985f-4f1180f7323c";
const imgIconCalendar = "https://www.figma.com/api/mcp/asset/84a0ded8-7ca8-4870-8369-15a5a59c01c0";

export default function Planning() {
  const navigate = useNavigate();
  const [travelers, setTravelers] = useState(1);
  const [departFrom, setDepartFrom] = useState('New York City');
  const [arriveAt, setArriveAt] = useState('Paris');
  // const [departDate, setDepartDate] = useState('');
  // const [returnDate, setReturnDate] = useState('');
  // const [budget, setBudget] = useState('5000');
  
  const handleIncrement = () => setTravelers(prev => prev + 1);
  const handleDecrement = () => setTravelers(prev => Math.max(1, prev - 1));
  
  const handleSwapLocations = () => {
    const temp = departFrom;
    setDepartFrom(arriveAt);
    setArriveAt(temp);
  };
  
  const [state, actionFunction, isPending] = useActionState(
    handleSubmission,
    {
      error: null,
      message: null
    }
  );

  async function handleSubmission(prevState, formData) {
    /*TODO: Use formData to call weather API, flight API, hotel API, etc.
        and return a comprehensive trip plan using OpenAI API. Once done,
        navigate to the results page with the generated plan.
    */
   console.log(formData);
   try {
     const weatherData = await fetchWeatherData(formData);
     const flightData = await fetchFlightData(formData);
     const hotelData = await fetchHotelData(formData);

     const tripPlan = await generateTripPlan({
       weather: weatherData,
       flights: flightData,
       hotels: hotelData
     });

     navigate('/results', { state: { tripPlan } });
   } catch (error) {
      console.error('Error generating trip plan:', error); 
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
              {/* TODO: May have to change div into an input */}
              <div className="counter-value">{travelers}</div>
              {/* <input
                type="number"
                className="counter-value"
                value={travelers}
                readOnly
              /> */}
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
                    className="location-input"
                    // value={departFrom}
                    // onChange={(e) => setDepartFrom(e.target.value)}
                    placeholder="Enter departure city"
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
                  {/* <img alt="" className="swap-arrow" src={imgIconSwap2} /> */}
                </div>
              </button>

              <div className="form-section">
                <label className="form-label">Arriving At</label>
                <div className="input-wrapper">
                  <img alt="" className="input-icon" src={imgIconLocation} />
                  <input
                    type="text"
                    className="location-input"
                    // value={arriveAt}
                    // onChange={(e) => setArriveAt(e.target.value)}
                    placeholder="Enter arrival city"
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
                  className="date-input"
                  // value={departDate}
                  // onChange={(e) => setDepartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">Return Date</label>
              <div className="input-wrapper">
                <img alt="" className="input-icon" src={imgIconCalendar} />
                <input
                  type="date"
                  className="date-input"
                  // value={returnDate}
                  // onChange={(e) => setReturnDate(e.target.value)}
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
                className="budget-input"
                // value={budget}
                // onChange={(e) => setBudget(e.target.value)}
                placeholder="Enter budget"
                min="0"
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
