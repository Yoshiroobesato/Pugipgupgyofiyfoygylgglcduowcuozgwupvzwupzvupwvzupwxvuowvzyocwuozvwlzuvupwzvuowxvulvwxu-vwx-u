// api/index.js
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Se requiere parámetro URL' });
  }

  try {
    // Decodificar la URL si es necesario
    const decodedUrl = decodeURIComponent(url);

    // Validar URL
    new URL(decodedUrl);

    const response = await fetchWithTimeout(decodedUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    
    // Buscar la URL de reproducción con múltiples patrones
    const patterns = [
      /playbackURL\s*=\s*["'](.+?)["']/i,
      /playback_url\s*=\s*["'](.+?)["']/i,
      /hlsURL\s*=\s*["'](.+?)["']/i,
      /source:\s*["'](.+?)["']/i,
      /src:\s*["'](.+?)["']/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return res.status(200).json({ 
          success: true,
          playbackURL: match[1],
          timestamp: new Date().toISOString()
        });
      }
    }

    // Si no se encuentra ninguna URL
    return res.status(404).json({ 
      success: false,
      error: 'URL de reproducción no encontrada',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error.message);
    
    return res.status(500).json({ 
      success: false,
      error: 'Error al procesar la solicitud',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Configuración de la API
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
