import { useState, useEffect, useRef } from 'react';
import { searchCityAirports } from '../apis/flightApi';
import './LocationAutocomplete.css';

/**
 * LocationAutocomplete Component
 * Provides autocomplete functionality for city/airport selection using Amadeus API
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Input name attribute
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Callback when value changes
 * @param {string} props.placeholder - Input placeholder text
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hasError - Whether field has validation error
 * @param {string} props.ariaDescribedby - ARIA describedby attribute
 * @returns {JSX.Element} LocationAutocomplete component
 */
export default function LocationAutocomplete({
  name,
  value,
  onChange,
  placeholder,
  required,
  className = '',
  hasError = false,
  ariaDescribedby
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceTimer = useRef(null);

  // Debounced search for city/airport suggestions
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Don't search for very short queries
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    // Set loading state after a small delay to avoid flashing
    const loadingTimer = setTimeout(() => {
      setIsLoading(true);
    }, 150);

    // Debounce the actual search
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchCityAirports(value);
        setSuggestions(results.slice(0, 5)); // Limit to 5 suggestions
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } finally {
        clearTimeout(loadingTimer);
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(debounceTimer.current);
      clearTimeout(loadingTimer);
    };
  }, [value]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      // Allow Enter to submit form when no suggestions
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    onChange(suggestion.cityName);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSuggestions([]);
  };

  // Handle input change
  const handleInputChange = (e) => {
    onChange(e.target.value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur with delay to allow click on suggestions
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // Update scroll position when selected index changes
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="autocomplete-wrapper">
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        className={`location-input ${className} ${hasError ? 'input-error' : ''}`}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={`${name}-listbox`}
        aria-expanded={showSuggestions && suggestions.length > 0}
        aria-activedescendant={
          selectedIndex >= 0 ? `${name}-option-${selectedIndex}` : undefined
        }
        aria-invalid={hasError}
        aria-describedby={ariaDescribedby}
        autoComplete="off"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="autocomplete-loading" role="status" aria-live="polite">
          <span className="sr-only">Searching locations...</span>
          <span className="loading-spinner"></span>
        </div>
      )}

      {/* Suggestions list */}
      {showSuggestions && suggestions.length > 0 && !isLoading && (
        <ul
          ref={listRef}
          id={`${name}-listbox`}
          className="autocomplete-list"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.iataCode}
              id={`${name}-option-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={`autocomplete-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="city-name">{suggestion.cityName}</span>
              <span className="airport-info">
                <span className="airport-code">{suggestion.iataCode}</span>
                {suggestion.countryCode && (
                  <span className="country-code">{suggestion.countryCode}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && value.length >= 2 && suggestions.length === 0 && (
        <div className="autocomplete-no-results" role="status">
          No locations found. Type a city name to search.
        </div>
      )}
    </div>
  );
}
