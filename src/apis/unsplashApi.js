import config from '../config';

/**
 * Search for destination photos on Unsplash
 * @param {string} query - Search query (e.g., "travel destination", "paris", "beach")
 * @param {number} count - Number of photos to fetch (default: 3)
 * @returns {Promise<Array<{url: string, alt: string, photographer: string, photographerUrl: string, downloadUrl: string}>>}
 */
export async function searchDestinationPhotos(query, count = 3) {
  const accessKey = config.unsplash.accessKey;

  if (!accessKey) {
    console.warn('Unsplash API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&count=${count}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const photos = await response.json();

    // Ensure we always have an array (API returns single object if count=1)
    const photosArray = Array.isArray(photos) ? photos : [photos];

    return photosArray.map(photo => ({
      url: photo.urls.regular, // Use 'regular' size for good quality/performance balance
      alt: photo.alt_description || photo.description || 'Travel destination',
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      downloadUrl: photo.links.download_location
    }));
  } catch (error) {
    console.error('Failed to fetch Unsplash photos:', error);
    return [];
  }
}

/**
 * Trigger download endpoint (required by Unsplash API guidelines)
 * This must be called when displaying an Unsplash photo
 * @param {string} downloadUrl - Download location URL from photo object
 */
export async function triggerUnsplashDownload(downloadUrl) {
  const accessKey = config.unsplash.accessKey;

  if (!accessKey || !downloadUrl) return;

  try {
    await fetch(downloadUrl, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`
      }
    });
  } catch (error) {
    console.error('Error triggering Unsplash download:', error);
  }
}

/**
 * Get a specific photo by ID
 * @param {string} photoId - Unsplash photo ID
 * @returns {Promise<{url: string, alt: string} | null>}
 */
export async function getPhotoById(photoId) {
  const accessKey = config.unsplash.accessKey;

  if (!accessKey) {
    console.warn('Unsplash API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/${photoId}`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const photo = await response.json();

    return {
      url: photo.urls.regular,
      alt: photo.alt_description || photo.description || 'Travel destination'
    };
  } catch (error) {
    console.error('Failed to fetch Unsplash photo:', error);
    return null;
  }
}
