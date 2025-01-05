import axios from "axios";
import cheerio from "cheerio";

// Configure axios defaults
const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

// Utility function to extract URL using different patterns
const extractPlaybackURL = (scriptText) => {
  const patterns = [
    /var playbackURL = ["'](.*?)["'];/,
    /playbackUrl:\s*["'](.*?)["']/,
    /videoUrl:\s*["'](.*?)["']/,
    /src:\s*["'](.*?)["']/
  ];

  for (const pattern of patterns) {
    const match = scriptText.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// Utility function to validate URL
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only GET requests are allowed'
    });
  }

  const { url } = req.query;

  // Validate URL parameter
  if (!url) {
    return res.status(400).json({
      error: 'Missing Parameter',
      message: 'The URL parameter is required'
    });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({
      error: 'Invalid URL',
      message: 'The provided URL is not valid'
    });
  }

  try {
    // Fetch the webpage content
    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);

    // Extract all script contents
    const scriptText = $('script')
      .map((i, el) => $(el).html())
      .get()
      .join(' ');

    // Try to extract the playback URL
    const playbackURL = extractPlaybackURL(scriptText);

    if (playbackURL) {
      // Validate extracted URL
      if (!isValidUrl(playbackURL)) {
        return res.status(422).json({
          error: 'Invalid Extracted URL',
          message: 'Found a URL but it appears to be invalid'
        });
      }

      return res.status(200).json({
        success: true,
        playbackURL,
        source: url
      });
    } else {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Could not find a valid playback URL in the page content'
      });
    }
  } catch (error) {
    // Handle specific errors
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Timeout',
        message: 'Request timed out while trying to fetch the URL'
      });
    }

    if (error.response) {
      // Handle HTTP errors from target website
      return res.status(502).json({
        error: 'External Service Error',
        message: `Target website returned status ${error.response.status}`,
        statusCode: error.response.status
      });
    }

    // Generic error handler
    console.error('Video extraction error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
