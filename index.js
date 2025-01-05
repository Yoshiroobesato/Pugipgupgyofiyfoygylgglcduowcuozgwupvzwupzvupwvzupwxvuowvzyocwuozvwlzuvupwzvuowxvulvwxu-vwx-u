const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

// Middleware de atribución
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'UltraTV');
    next();
});

// Manejador de errores personalizados
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        error: {
            status: statusCode,
            message: message,
            attribution: 'Powered by UltraTV - https://ultratv.neocities.org/'
        }
    });
});

// Ruta para obtener la tabla de posiciones de la Premier League
app.get('/api/liga/inglaterra/tabla', async (req, res, next) => {
    const url = 'https://www.tycsports.com/estadisticas/premier-league-de-inglaterra/tabla-de-posiciones.html';

    try {
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);

        const equipos = [];
        $('tr').each((index, element) => {
            const pos = $(element).find('.pos').text().trim();
            const img = $(element).find('.escudo img').attr('data-src') || '';
            const equipo = $(element).find('.equipo').text().trim();
            const puntos = $(element).find('.puntos').eq(0).text().trim();
            const pj = $(element).find('td').eq(4).text().trim();
            const pg = $(element).find('td').eq(5).text().trim();
            const pe = $(element).find('td').eq(6).text().trim();
            const pp = $(element).find('td').eq(7).text().trim();
            const gf = $(element).find('td').eq(8).text().trim();
            const gc = $(element).find('td').eq(9).text().trim();

            const equipoObj = { pos, img, equipo, puntos, pj, pg, pe, pp, gf, gc };

            // Filtrar datos que coinciden con el encabezado o están vacíos
            if (
                !(equipoObj.pos === "Pos" &&
                  equipoObj.img === "" &&
                  equipoObj.equipo === "Equipo" &&
                  equipoObj.puntos === "Pts" &&
                  equipoObj.pj === "" &&
                  equipoObj.pg === "" &&
                  equipoObj.pe === "" &&
                  equipoObj.pp === "" &&
                  equipoObj.gf === "" &&
                  equipoObj.gc === "")
            ) {
                equipos.push(equipoObj);
            }
        });

        res.json({
            data: equipos,
            attribution: 'Powered by UltraTV - https://ultratv.neocities.org/'
        });
    } catch (error) {
        next(error);
    }
});

// Middleware para manejar rutas no encontradas
app.use((req, res, next) => {
    const error = new Error('Ruta no encontrada');
    error.statusCode = 404;
    next(error);
});

// Middleware de manejo de errores
app.use(errorHandler);

// Exportar la app para Vercel
module.exports = app;
