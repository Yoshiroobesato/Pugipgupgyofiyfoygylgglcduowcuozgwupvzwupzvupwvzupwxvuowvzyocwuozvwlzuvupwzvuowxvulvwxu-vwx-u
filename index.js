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
};

// Ruta para obtener la tabla de posiciones
app.get('/api/liga/englaterra/tabla', async (req, res, next) => {
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

    // Eliminar si todos los datos coinciden con el ejemplo dado
    if (
        equipoObj.pos !== "Pos" ||
        equipoObj.img !== "" ||
        equipoObj.equipo !== "Equipo" ||
        equipoObj.puntos !== "Pts" ||
        equipoObj.pj !== "" ||
        equipoObj.pg !== "" ||
        equipoObj.pe !== "" ||
        equipoObj.pp !== "" ||
        equipoObj.gf !== "" ||
        equipoObj.gc !== ""
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

// Ruta para obtener la agenda de una jornada
app.get('/api/liga/espana/:jornada/agenda', async (req, res, next) => {
    const { jornada } = req.params;
    const url = 'https://www.marca.com/futbol/primera-division/calendario.html';

    try {
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);

        const agenda = [];
        $('.resultado-partido').each((index, element) => {
            const local = $(element).closest('tr').find('.local span').text().trim();
            const visitante = $(element).closest('tr').find('.visitante span').text().trim();
            const resultado = $(element).text().trim();

            if (local && visitante) {
                agenda.push({ local, visitante, resultado });
            }
        });

        res.json({
            data: agenda,
            attribution: 'Powered by UltraTV - https://ultratv.neocities.org/'
        });
    } catch (error) {
        next(error);
    }
});

// Ruta para listar equipos con IDs
app.get('/api/liga/espana/equipos', (req, res, next) => {
    try {
        const equipos = [
            { equipo: 'Real Madrid', id: 86 },
            { equipo: 'Barcelona', id: 83 },
            { equipo: 'Atlético Madrid', id: 1068 },
            { equipo: 'Sevilla FC', id: 243 },
            { equipo: 'Osasuna', id: 97 },
            { equipo: 'Real Betis', id: 244 },
            { equipo: 'Rayo Vallecano', id: 101 },
            { equipo: 'Valencia', id: 94 },
            { equipo: 'Real Sociedad', id: 89 },
            { equipo: 'Espanyol', id: 88 },
            { equipo: 'Celta Vigo', id: 85 },
            { equipo: 'Mallorca', id: 84 },
            { equipo: 'Alavés', id: 96 },
            { equipo: 'Athletic Club', id: 93 },
            { equipo: 'Girona', id: 9812 },
            { equipo: 'Real Valladolid', id: 95 },
            { equipo: 'Getafe', id: 2922 },
            { equipo: 'Villarreal', id: 102 },
            { equipo: 'Leganés', id: 17534 },
            { equipo: 'Las Palmas', id: 98 }
        ];

        res.json({
            data: equipos,
            attribution: 'Powered by UltraTV - https://ultratv.neocities.org/'
        });
    } catch (error) {
        next(error);
    }
});

// Ruta para obtener el plantel de un equipo por ID
app.get('/api/liga/espana/:id/plantel', async (req, res, next) => {
    const { id } = req.params;
    const url = `https://espndeportes.espn.com/futbol/equipo/plantel/_/id/${id}/liga/ESP.1/temporada/2024`;

    try {
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);

        const plantel = [];
        $('.Table__TBODY .Table__TR').each((index, element) => {
            const nombre = $(element).find('td .inline a').text().trim();
            const dorsal = $(element).find('td .inline span').text().trim();
            const posicion = $(element).find('td').eq(1).text().trim();

            if (nombre) {
                plantel.push({ nombre, dorsal, posicion });
            }
        });

        if (plantel.length > 0) {
            res.json({
                data: plantel,
                attribution: 'Powered by UltraTV - https://ultratv.neocities.org/'
            });
        } else {
            const error = new Error('No se encontraron jugadores para el equipo indicado.');
            error.statusCode = 404;
            throw error;
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = 'No se pudo obtener el plantel del equipo.';
        }
        next(error);
    }
});

// 404 para rutas no definidas
app.use((req, res, next) => {
    const error = new Error('Ruta no encontrada');
    error.statusCode = 404;
    next(error);
});

// Middleware de manejo de errores
app.use(errorHandler);

// Exportar la app para Vercel
module.exports = app;
