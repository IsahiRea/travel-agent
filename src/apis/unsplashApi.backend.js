/**
 * Unsplash API Module (Backend Version)
 * Calls serverless functions instead of external APIs directly
 * This version secures API keys by moving them to the backend
 */

/**
 * Search for destination photos on Unsplash via backend
 * @param {string} query - Search query (e.g., "travel destination", "paris", "beach")
 * @param {number} count - Number of photos to fetch (default: 3)
 * @returns {Promise<Array<{url: string, alt: string, photographer: string, photographerUrl: string, downloadUrl: string}>>}
 */
export async function searchDestinationPhotos(query, count = 3) {
  try {
    console.log('Fetching Unsplash photos from backend API...');

    const response = await fetch('/api/unsplash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'search',
        query,
        count
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend API error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch Unsplash photos');
    }

    return result.photos;

  } catch (error) {
    console.error('Error fetching Unsplash photos:', error);
    return [];
  }
}

/**
 * Trigger download endpoint (required by Unsplash API guidelines)
 * This must be called when displaying an Unsplash photo
 * @param {string} downloadUrl - Download location URL from photo object
 */
export async function triggerUnsplashDownload(downloadUrl) {
  if (!downloadUrl) return;

  try {
    await fetch('/api/unsplash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'download',
        downloadUrl
      })
    });
  } catch (error) {
    console.error('Error triggering Unsplash download:', error);
  }
}

/**
 * Get a specific photo by ID
 * Note: This would require a separate backend endpoint
 * For now, returns null (can be implemented if needed)
 * @param {string} photoId - Unsplash photo ID
 * @returns {Promise<{url: string, alt: string} | null>}
 */
export async function getPhotoById(photoId) {
  console.warn('getPhotoById not yet implemented for backend API');
  return null;
}
