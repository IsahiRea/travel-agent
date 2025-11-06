import { useState, useEffect } from 'react';
import Icon from '../Icon';
import { formatDate } from '../../utils/formatters';
import { searchDestinationPhotos, triggerUnsplashDownload } from '../../apis/unsplashApi.backend';
import imgHeroEiffel from '../../assets/images/photos/hero-eiffel.jpg';
import '../../styles/components/TripHeader.css';

export default function TripHeader({ destination, tripData, isStreaming }) {
  const [heroImage, setHeroImage] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  // Fetch destination-specific image from Unsplash
  useEffect(() => {
    async function fetchDestinationImage() {
      if (!tripData?.arriveAt) {
        setIsLoadingImage(false);
        return;
      }

      setIsLoadingImage(true);

      try {
        const photos = await searchDestinationPhotos(`${tripData.arriveAt} travel landmark`, 1);

        if (photos && photos.length > 0) {
          setHeroImage(photos[0]);
          // Trigger download endpoint as per Unsplash guidelines
          triggerUnsplashDownload(photos[0].downloadUrl);
        }
      } catch (error) {
        console.error('Error loading destination image:', error);
      } finally {
        setIsLoadingImage(false);
      }
    }

    fetchDestinationImage();
  }, [tripData?.arriveAt]);

  // Use Unsplash image if available, otherwise fallback to local
  const displayImage = heroImage?.url || imgHeroEiffel;
  const displayAlt = heroImage?.alt || destination || tripData?.arriveAt || 'Your destination';

  return (
    <div className="hero-banner">
      {isLoadingImage && <div className="hero-image-skeleton" />}
      <img
        alt={displayAlt}
        className="hero-image"
        src={displayImage}
        loading="eager"
        onError={(e) => {
          // Fallback if image fails to load
          e.target.src = imgHeroEiffel;
        }}
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="itinerary-badge">
          <Icon name="itinerary" className="badge-icon" size={16} color="white" alt="Itinerary document" />
          <span className="results-badge-text">Your Itinerary</span>
          {isStreaming && (
            <span className="streaming-badge">Generating...</span>
          )}
        </div>
        <div className="hero-info">
          <h1 className="trip-title">Trip to {destination || tripData.arriveAt}</h1>
          <div className="trip-meta">
            <div className="meta-card">
              <Icon name="calendar" className="meta-icon" size={20} color="white" alt="Calendar" />
              <div className="meta-content">
                <span className="meta-text">{formatDate(tripData.departDate)}</span>
                <Icon name="arrowRight" className="arrow-icon" size={16} color="white" alt="to" />
                <span className="meta-text">{formatDate(tripData.returnDate)}</span>
              </div>
            </div>
            <div className="meta-card">
              <Icon name="location" className="meta-icon" size={20} color="white" alt="Location" />
              <div className="meta-content">
                <span className="meta-text">{tripData.departFrom}</span>
                <Icon name="arrowRight" className="arrow-icon" size={16} color="white" alt="to" />
                <span className="meta-text">{tripData.arriveAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unsplash Attribution (required by Unsplash API guidelines) */}
      {heroImage && (
        <div className="photo-credit">
          Photo by{' '}
          <a
            href={`${heroImage.photographerUrl}?utm_source=travel-agent&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {heroImage.photographer}
          </a>
          {' '}on{' '}
          <a
            href="https://unsplash.com?utm_source=travel-agent&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
          >
            Unsplash
          </a>
        </div>
      )}
    </div>
  );
}
