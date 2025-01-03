const https = require('https');
const { parse } = require('querystring');

module.exports = (req, res) => {
    const { channel } = req.query; // Obtener el canal desde la consulta ?channel=espn1

    if (!channel) {
        return res.status(400).json({ error: 'El parámetro "channel" es obligatorio' });
    }

    try {
        // URL dinámica en función del canal proporcionado
        const url = `https://streamtp2.com/global1.php?stream=${channel}`;

        // Realizar la solicitud HTTP
        https.get(url, (response) => {
            let data = '';

            // Recibir los datos en fragmentos
            response.on('data', (chunk) => {
                data += chunk;
            });

            // Procesar los datos cuando se reciban completamente
            response.on('end', () => {
                try {
                    // Buscar la variable playbackURL en el HTML
                    const playbackURLMatch = data.match(/playbackURL\s*=\s*"([^"]+)"/);
                    const extractedUrl = playbackURLMatch ? playbackURLMatch[1] : null;

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
                                    quality: 'HD',
                                },
                            },
                        };

                        res.json(jsonResponse);
                    } else {
                        res.status(404).json({ error: 'No se pudo extraer el URL del canal' });
                    }
                } catch (err) {
                    res.status(500).json({ error: 'Error procesando los datos', details: err.message });
                }
            });
        }).on('error', (err) => {
            res.status(500).json({ error: 'Error realizando la solicitud HTTP', details: err.message });
        });
    } catch (err) {
        res.status(500).json({ error: 'Error interno del servidor', details: err.message });
    }
};
