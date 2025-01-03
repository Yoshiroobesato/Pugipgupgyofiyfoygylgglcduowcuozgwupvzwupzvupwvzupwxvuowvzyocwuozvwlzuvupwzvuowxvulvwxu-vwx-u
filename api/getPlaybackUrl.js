import axios from 'axios';
import cheerio from 'cheerio';

export default async function handler(req, res) {
    const { channel } = req.query;  // Obtener el canal de la consulta ?channel=espn1

    if (!channel) {
        return res.status(400).json({ error: 'El parámetro "channel" es obligatorio' });
    }

    try {
        // URL dinámica en función del canal proporcionado
        const url = `https://streamtp2.com/global1.php?stream=${channel}`;
        
        // Realizamos la solicitud HTTP
        const response = await axios.get(url);

        // Usamos Cheerio para cargar el HTML de la página
        const $ = cheerio.load(response.data);
        
        // Buscamos la variable playbackURL en el HTML
        const playbackURL = $("script")
            .toArray()
            .map(script => script.children[0] ? script.children[0].data : "")
            .find(data => data.includes("playbackURL"));

        // Extraemos el URL de la variable playbackURL
        const urlMatch = playbackURL.match(/"([^"]+)"/);
        const extractedUrl = urlMatch ? urlMatch[1] : null;

        if (extractedUrl) {
            // Crear el objeto JSON de la respuesta
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

            res.status(200).json(jsonResponse);
        } else {
            res.status(404).json({ error: 'No se pudo extraer el URL del canal' });
        }
    } catch (error) {
        console.error('Error al obtener la página:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
