const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Manejar preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { channel } = req.query;

    if (!channel) {
        return res.status(400).json({
            error: 'El parámetro "channel" es obligatorio'
        });
    }

    try {
        // Configuración de la solicitud
        const config = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://streamtp2.com/',
            },
            timeout: 10000,
            maxRedirects: 5,
        };

        // Realizar la solicitud con manejo de errores mejorado
        let response;
        try {
            response = await axios.get(
                `https://streamtp2.com/global1.php?stream=${channel}`,
                config
            );
        } catch (axiosError) {
            console.error('Error en la solicitud axios:', axiosError.message);
            if (axiosError.response) {
                // El servidor respondió con un código de estado fuera del rango 2xx
                throw new Error(`Error del servidor externo: ${axiosError.response.status}`);
            } else if (axiosError.request) {
                // La solicitud se realizó pero no se recibió respuesta
                throw new Error('No se recibió respuesta del servidor externo');
            } else {
                // Error al configurar la solicitud
                throw new Error(`Error de configuración: ${axiosError.message}`);
            }
        }

        // Verificar la respuesta
        if (!response.data) {
            throw new Error('Respuesta vacía del servidor');
        }

        // Cargar y analizar el HTML
        const $ = cheerio.load(response.data);
        
        // Buscar la URL del stream
        let extractedUrl = null;
        
        // Buscar en todos los scripts
        $('script').each((_, element) => {
            const content = $(element).html();
            if (content && content.includes('playbackURL')) {
                const matches = content.match(/playbackURL\s*=\s*["']([^"']+)["']/);
                if (matches && matches[1]) {
                    extractedUrl = matches[1];
                    return false; // Romper el loop una vez encontrado
                }
            }
        });

        if (!extractedUrl) {
            return res.status(404).json({
                error: 'No se pudo encontrar la URL del stream',
                timestamp: new Date().toISOString()
            });
        }

        // Devolver respuesta exitosa
        return res.status(200).json({
            playbackURL: extractedUrl,
            p2pConfig: {
                live: true,
                trackerZone: 'us',
                channel: channel,
                additionalInfo: {
                    region: 'US',
                    quality: 'HD'
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        // Log detallado del error
        console.error('Error detallado:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Enviar respuesta de error
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
