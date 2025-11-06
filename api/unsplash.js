/**
 * Vercel Serverless Function for Unsplash Photos
 * Handles Unsplash API with secure credentials
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { query, count = 3 } = req.query;

    // Validate
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY; // SECURE

    if (!accessKey) {
      return res.status(500).json({ error: 'Unsplash API key not configured' });
    }

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

    const transformedPhotos = photosArray.map(photo => ({
      url: photo.urls.regular,
      alt: photo.alt_description || photo.description || 'Travel destination',
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      downloadUrl: photo.links.download_location
    }));

    return res.status(200).json({
      success: true,
      data: transformedPhotos
    });

  } catch (error) {
    console.error('Unsplash API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch photos'
    });
  }
}
