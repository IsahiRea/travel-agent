/**
 * Vercel Serverless Function for Unsplash Photos
 * Handles Unsplash API calls to secure access key
 */

/**
 * Search for destination photos on Unsplash
 */
async function searchPhotos(query, count = 3) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    throw new Error('Unsplash API key not configured');
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

  // Ensure we always have an array
  const photosArray = Array.isArray(photos) ? photos : [photos];

  return photosArray.map(photo => ({
    url: photo.urls.regular,
    alt: photo.alt_description || photo.description || 'Travel destination',
    photographer: photo.user.name,
    photographerUrl: photo.user.links.html,
    downloadUrl: photo.links.download_location
  }));
}

/**
 * Trigger download endpoint (required by Unsplash API guidelines)
 */
async function triggerDownload(downloadUrl) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    throw new Error('Unsplash API key not configured');
  }

  await fetch(downloadUrl, {
    headers: {
      'Authorization': `Client-ID ${accessKey}`
    }
  });
}

/**
 * Main handler for Vercel serverless function
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Allow both GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle different actions
    const action = req.method === 'GET' ? req.query.action : req.body.action;

    if (action === 'search') {
      // Search for photos
      const query = req.method === 'GET' ? req.query.query : req.body.query;
      const count = req.method === 'GET' ? parseInt(req.query.count || '3') : (req.body.count || 3);

      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const photos = await searchPhotos(query, count);

      return res.status(200).json({
        success: true,
        photos
      });

    } else if (action === 'download') {
      // Trigger download tracking
      const downloadUrl = req.method === 'GET' ? req.query.downloadUrl : req.body.downloadUrl;

      if (!downloadUrl) {
        return res.status(400).json({ error: 'downloadUrl parameter is required' });
      }

      await triggerDownload(downloadUrl);

      return res.status(200).json({
        success: true
      });

    } else {
      return res.status(400).json({ error: 'Invalid action. Use "search" or "download"' });
    }

  } catch (error) {
    console.error('Unsplash API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch Unsplash data'
    });
  }
}
