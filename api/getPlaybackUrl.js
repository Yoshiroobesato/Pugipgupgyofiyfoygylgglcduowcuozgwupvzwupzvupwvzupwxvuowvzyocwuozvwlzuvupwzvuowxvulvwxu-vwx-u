import axios from 'axios';
import * as cheerio from 'cheerio';

export const config = {
  runtime: 'edge',  // Use edge runtime for better performance
};

export default async function handler(req) {
  try {
    // Get the URL parameters
    const url = new URL(req.url);
    const channel = url.searchParams.get('channel');

    if (!channel) {
      return new Response(
        JSON.stringify({ error: 'El parámetro "channel" es obligatorio' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Add headers to avoid CORS and user-agent issues
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    // Make the request with proper error handling
    const response = await axios.get(
      `https://streamtp2.com/global1.php?stream=${channel}`,
      { headers, timeout: 5000 }
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Load HTML with cheerio
    const $ = cheerio.load(response.data);

    // Find playbackURL in scripts
    let extractedUrl = null;
    $('script').each((_, element) => {
      const content = $(element).html();
      if (content && content.includes('playbackURL')) {
        const match = content.match(/playbackURL\s*=\s*["']([^"']+)["']/);
        if (match && match[1]) {
          extractedUrl = match[1];
        }
      }
    });

    if (!extractedUrl) {
      return new Response(
        JSON.stringify({ error: 'No se pudo encontrar la URL del stream' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Create response object
    const jsonResponse = {
      playbackURL: extractedUrl,
      p2pConfig: {
        live: true,
        trackerZone: 'us',
        channel: channel,
        additionalInfo: {
          region: 'US',
          quality: 'HD'
        }
      }
    };

    // Return successful response
    return new Response(
      JSON.stringify(jsonResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    
    // Return detailed error response
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
