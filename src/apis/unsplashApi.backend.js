/**
 * Unsplash API Module (Secure Backend Version)
 * Handles Unsplash photo API calls via secure backend
 */

import { apiGet } from '../utils/apiClient.js';

/**
 * Search for destination photos on Unsplash via secure backend
 * @param {string} query - Search query (e.g., "travel destination", "paris", "beach")
 * @param {number} count - Number of photos to fetch (default: 3)
 * @returns {Promise<Array<{url: string, alt: string, photographer: string, photographerUrl: string, downloadUrl: string}>>}
 */
export async function searchDestinationPhotos(query, count = 3) {
  try {
    const data = await apiGet(
      `/api/unsplash?query=${encodeURIComponent(query)}&count=${count}`,
      {
        serviceName: 'Unsplash photos',
        errorMessage: 'Failed to fetch photos',
        returnEmptyOnError: true,
      }
    );
    return data || [];
  } catch (error) {
    console.error('Failed to fetch Unsplash photos:', error);
    return [];
  }
}

/**
 * Trigger download endpoint (required by Unsplash API guidelines)
 * This must be called when displaying an Unsplash photo
 * Note: This is not yet implemented in the backend
 * @param {string} downloadUrl - Download location URL from photo object
 */
export async function triggerUnsplashDownload(_downloadUrl) {
  // TODO: Implement backend endpoint for Unsplash download trigger
  console.warn('Unsplash download trigger not yet implemented in secure backend');
}

/**
 * Get a specific photo by ID
 * Note: This is not yet implemented in the backend
 * @param {string} photoId - Unsplash photo ID
 * @returns {Promise<{url: string, alt: string} | null>}
 */
export async function getPhotoById(_photoId) {
  // TODO: Implement backend endpoint for getting photo by ID
  console.warn('Get photo by ID not yet implemented in secure backend');
  return null;
}
