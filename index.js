const https = require("https");
const http = require("http");

// URL del sitio a analizar
const targetURL = "https://la12hd.com/vivo/canal.php?stream=espn";

// Expresión regular para capturar el valor de playbackURL
const regex = /var playbackURL = "(.*?)";/;

// Función para obtener playbackURL desde la página
function fetchPlaybackURL(callback) {
  https.get(targetURL, (res) => {
    let data = "";

    // Recibir fragmentos de datos
    res.on("data", (chunk) => {
      data += chunk;
    });

    // Procesar la respuesta completa
    res.on("end", () => {
      const match = data.match(regex);
      if (match && match[1]) {
        callback(null, match[1]); // Retorna el valor de playbackURL
      } else {
        callback("playbackURL not found");
      }
    });
  }).on("error", (err) => {
    callback(err.message);
  });
}

// Crear un servidor HTTP
const server = http.createServer((req, res) => {
  if (req.url === "/getPlaybackURL") {
    fetchPlaybackURL((err, playbackURL) => {
      res.setHeader("Content-Type", "application/json");
      if (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({ playbackURL }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

// Iniciar el servidor
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
