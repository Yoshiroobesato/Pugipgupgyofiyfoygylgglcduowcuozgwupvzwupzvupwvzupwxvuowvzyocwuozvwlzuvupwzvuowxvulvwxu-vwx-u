import axios from "axios";

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  // Basic URL validation
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Simple GET request with minimal configuration
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible)'
      }
    });

    // Simple regex to find the playback URL
    const match = response.data.match(/var playbackURL = ["'](.*?)["'];/);
    
    if (match && match[1]) {
      return res.status(200).json({ playbackURL: match[1] });
    }

    return res.status(404).json({ error: 'Playback URL not found' });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
