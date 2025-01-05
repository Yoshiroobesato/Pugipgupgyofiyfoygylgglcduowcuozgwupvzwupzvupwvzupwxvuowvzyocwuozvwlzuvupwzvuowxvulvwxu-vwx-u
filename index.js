
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible)'
      }
    });

    const text = await response.text();
    const match = text.match(/var playbackURL = ["'](.*?)["'];/);
    
    if (match && match[1]) {
      return res.status(200).json({ playbackURL: match[1] });
    }

    return res.status(404).json({ error: 'Playback URL not found' });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
