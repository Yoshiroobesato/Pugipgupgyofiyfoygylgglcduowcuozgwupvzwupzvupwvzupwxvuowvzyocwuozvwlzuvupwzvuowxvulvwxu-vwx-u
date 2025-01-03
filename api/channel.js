const https = require('https');

module.exports = (req, res) => {
    const { channel } = req.query; // Obtener el canal desde la consulta ?channel=espn1

    if (!channel) {
        return res.status(400).json({ error: 'El parámetro "channel" es obligatorio' });
    }

    // URL dinámica en función del canal proporcionado
    const url = `https://streamtp2.com/global1.php?stream=${channel}`;

    https.get(url, (response) => {
        let data = '';

        // Recibir los datos en fragmentos
        response.on('data', (chunk) => {
            data += chunk;
        });

        // Procesar los datos cuando se reciban completamente
        response.on('end', () => {
            try {
                // Buscar el inicio de la variable playbackURL
                const startIndex = data.indexOf('playbackURL');
                if (startIndex === -1) {
                    return res.status(404).json({ error: 'No se pudo encontrar playbackURL en el HTML' });
                }

                // Buscar el inicio y fin del valor de playbackURL
                const urlStart = data.indexOf('"', startIndex) + 1;
                const urlEnd = data.indexOf('"', urlStart);
                const playbackURL = data.slice(urlStart, urlEnd);

                if (playbackURL) {
                    // Crear la respuesta JSON
                    const jsonResponse = {
                        playbackURL: playbackURL,
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

                    return res.json(jsonResponse);
                } else {
                    return res.status(404).json({ error: 'No se pudo extraer playbackURL' });
                }
            } catch (error) {
                return res.status(500).json({ error: 'Error procesando los datos', details: error.message });
            }
        });
    }).on('error', (err) => {
        res.status(500).json({ error: 'Error realizando la solicitud HTTP', details: err.message });
    });
};
